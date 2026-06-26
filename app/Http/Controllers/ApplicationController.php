<?php

namespace App\Http\Controllers;

use App\Actions\Fortify\CreateNewUser;
use App\Models\Application;
use App\Support\ApplianceData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('apply');
    }

    public function submit(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],
            'data.fullName' => ['required', 'string', 'max:255'],
            'data.email' => ['required', 'string', 'email', 'max:255'],
            'data.password' => ['required', 'string', 'min:8'],
            'data.confirmPassword' => ['required', 'string', 'same:data.password'],
            'data.selectedPlan' => ['required', 'string', 'in:Starter,Masstige,Premium'],
            'data.buildingType' => ['required', 'string', 'in:Residential,Commercial,Industrial'],
            'data.phone' => ['required', 'string'],
            'data.billingAddress' => ['sometimes', 'array'],
            'data.billingAddress.street' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.billingAddress.city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.billingAddress.state' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.billingAddress.country' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.location' => ['sometimes', 'array'],
            'data.location.lat' => ['sometimes', 'numeric'],
            'data.location.lng' => ['sometimes', 'numeric'],
            'data.location.formattedAddress' => ['sometimes', 'nullable', 'string', 'max:500'],
            'data.location.street' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.location.city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.location.state' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.location.country' => ['sometimes', 'nullable', 'string', 'max:255'],
            'data.ndpr' => ['sometimes', 'boolean'],
            'data.monthlySalary' => ['sometimes', 'numeric'],
            'data.monthlyRevenue' => ['sometimes', 'numeric'],
            'data.monthlyBill' => ['sometimes', 'numeric'],
            'data.monthlyGenerator' => ['sometimes', 'numeric'],
            'data.appliances' => ['sometimes', 'array'],
        ]);

        $data = $validated['data'];

        $userData = [
            'name' => $data['fullName'],
            'email' => $data['email'],
            'password' => $data['password'],
            // G11: use the actual confirm password value, not a duplicate of password
            'password_confirmation' => $data['confirmPassword'] ?? $data['password'],
        ];

        $user = (new CreateNewUser)->create($userData);

        $phone = $data['phone'] ?? null;

        $user->update([
            'role' => 'customer',
            'phone' => $phone,
        ]);

        $buildingType = $data['buildingType'] ?? '';
        $selectedPlan = $data['selectedPlan'] ?? '';
        $monthlyIncome = (int) ($data['monthlySalary'] ?? $data['monthlyRevenue'] ?? 0);
        $monthlyBill = (int) ($data['monthlyBill'] ?? 0);
        $monthlyGenerator = (int) ($data['monthlyGenerator'] ?? 0);

        $appliances = $data['appliances'] ?? [];
        $totalLoad = 0;
        $applianceRecords = [];
        foreach ($appliances as $key => $quantity) {
            $qty = (int) $quantity;
            if ($qty <= 0) {
                continue;
            }
            $info = ApplianceData::find($key, $buildingType);
            if ($info === null) {
                continue;
            }
            $totalLoad += $info['watts'] * $qty;
            $applianceRecords[] = [
                'appliance_key' => $key,
                'label' => $info['label'],
                'watts_per_unit' => $info['watts'],
                'quantity' => $qty,
            ];
        }

        // G8: All monetary values stored in kobo (1 naira = 100 kobo)
        // Starter = ₦35,000/month = 3,500,000 kobo
        // Masstige = ₦68,000/month = 6,800,000 kobo
        // Premium = ₦110,000/month = 11,000,000 kobo
        $planPrice = match ($selectedPlan) {
            'Starter' => 3_500_000,   // ₦35,000 in kobo
            'Masstige' => 6_800_000,   // ₦68,000 in kobo
            'Premium' => 11_000_000,  // ₦110,000 in kobo
            default => 0,
        };

        $application = Application::create([
            'user_id' => $user->id,
            'full_name' => $data['fullName'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'],
            'ndpr_consented' => $data['ndpr'] ?? false,
            'location_lat' => $data['location']['lat'] ?? null,
            'location_lng' => $data['location']['lng'] ?? null,
            'location_address' => $data['location']['formattedAddress'] ?? null,
            'location_street' => $data['location']['street'] ?? null,
            'location_city' => $data['location']['city'] ?? null,
            'location_state' => $data['location']['state'] ?? null,
            'location_country' => $data['location']['country'] ?? null,
            'billing_street' => $data['billingAddress']['street'] ?? null,
            'billing_city' => $data['billingAddress']['city'] ?? null,
            'billing_state' => $data['billingAddress']['state'] ?? null,
            'billing_country' => $data['billingAddress']['country'] ?? null,
            'submitted_at' => now(),
            'status' => Application::STATUS_SUBMITTED,
            'building_type' => $buildingType ?: null,
            'selected_plan' => $selectedPlan ?: null,
            'monthly_income' => $monthlyIncome * 100,
            'monthly_bill' => $monthlyBill * 100,
            'monthly_generator' => $monthlyGenerator * 100,
            'total_load_watts' => $totalLoad,
            'deposit_amount' => (int) round($planPrice * 0.2),
            'monthly_lease_amount' => $planPrice,
        ]);

        if ($applianceRecords !== []) {
            $application->appliances()->createMany($applianceRecords);
        }

        Auth::login($user);

        return to_route('dashboard');
    }
}
