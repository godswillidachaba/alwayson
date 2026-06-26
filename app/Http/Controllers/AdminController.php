<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\InstallationChecklistItem;
use App\Models\InstallerTicket;
use App\Models\Payment;
use App\Models\SiteContent;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Response;

class AdminController extends Controller
{
    public function applications(): Response
    {
        $applications = Application::with('user', 'assignedSales')
            ->whereNotNull('submitted_at')
            ->latest()
            ->take(100)
            ->get()
            ->map(fn (Application $app) => [
                'id' => $app->id,
                'name' => $app->user->name ?? 'Unknown',
                'email' => $app->user->email ?? '',
                'phone' => $app->user->phone ?? '',
                'plan' => $app->selected_plan,
                'status' => $app->status,
                'assignedSales' => $app->assigned_sales_id ? (string) $app->assigned_sales_id : null,
                'submittedAt' => optional($app->submitted_at)->diffForHumans(),
            ]);

        $salesReps = User::whereIn('role', [User::ROLE_SALES, User::ROLE_OPERATIONS])
            ->get(['id', 'name', 'email']);

        $installers = User::where('role', User::ROLE_INSTALLER)
            ->get(['id', 'name', 'email']);

        $pipeline = User::whereIn('role', [User::ROLE_SALES, User::ROLE_OPERATIONS])
            ->withCount([
                'assignedApplications as submitted' => fn ($q) => $q->where('status', Application::STATUS_SUBMITTED),
                'assignedApplications as address_verification' => fn ($q) => $q->where('status', Application::STATUS_ADDRESS_VERIFICATION),
                'assignedApplications as identity_verification' => fn ($q) => $q->where('status', Application::STATUS_IDENTITY_VERIFICATION),
                'assignedApplications as under_review' => fn ($q) => $q->where('status', Application::STATUS_UNDER_REVIEW),
                'assignedApplications as esign_pending' => fn ($q) => $q->where('status', Application::STATUS_ESIGN_PENDING),
                'assignedApplications as approved' => fn ($q) => $q->where('status', Application::STATUS_APPROVED),
                'assignedApplications as installed' => fn ($q) => $q->where('status', Application::STATUS_INSTALLED),
                'assignedApplications as active' => fn ($q) => $q->where('status', Application::STATUS_ACTIVE),
                'assignedApplications as declined' => fn ($q) => $q->where('status', Application::STATUS_DECLINED),
            ])
            ->get()
            ->map(fn (User $rep) => [
                'id' => $rep->id,
                'name' => $rep->name,
                'email' => $rep->email,
                'submitted' => (int) $rep->getAttribute('submitted'),
                'addressVerification' => (int) $rep->getAttribute('address_verification'),
                'identityVerification' => (int) $rep->getAttribute('identity_verification'),
                'underReview' => (int) $rep->getAttribute('under_review'),
                'esignPending' => (int) $rep->getAttribute('esign_pending'),
                'approved' => (int) $rep->getAttribute('approved'),
                'installed' => (int) $rep->getAttribute('installed'),
                'active' => (int) $rep->getAttribute('active'),
                'declined' => (int) $rep->getAttribute('declined'),
            ]);

        $kycReview = Application::with('user', 'kycDocuments')
            ->where('status', Application::STATUS_UNDER_REVIEW)
            ->latest()
            ->get()
            ->map(function (Application $app) {
                /** @var array<string, mixed>|null $bvnData */
                $bvnData = $app->identity_bvn_data;

                return [
                    'id' => $app->id,
                    'name' => $app->user->name ?? 'Unknown',
                    'email' => $app->user->email ?? '',
                    'addressVerified' => $app->addressVerified(),
                    'billingAddress' => [
                        'street' => $app->billing_street,
                        'city' => $app->billing_city,
                        'state' => $app->billing_state,
                        'country' => $app->billing_country,
                    ],
                    'identityVerified' => $app->identityVerified(),
                    'bvnMatch' => $bvnData ? ($bvnData['entity']['first_name']['status'] ?? null) : null,
                    'addressDocument' => $app->address_document_path
                        ? Storage::url($app->address_document_path) : null,
                    'identityDocument' => $app->identity_document_path
                        ? Storage::url($app->identity_document_path) : null,
                    'submittedAt' => optional($app->submitted_at)->diffForHumans(),
                ];
            });

        return inertia('dashboard/admin/applications', [
            'applications' => $applications,
            'salesReps' => $salesReps,
            'installers' => $installers,
            'salesPipeline' => $pipeline,
            'kycReview' => $kycReview,
        ]);
    }

    public function updateApplication(Request $request, Application $application): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in([
                Application::STATUS_SUBMITTED,
                Application::STATUS_ADDRESS_VERIFICATION,
                Application::STATUS_IDENTITY_VERIFICATION,
                Application::STATUS_UNDER_REVIEW,
                Application::STATUS_ESIGN_PENDING,
                Application::STATUS_APPROVED,
                Application::STATUS_INSTALLED,
                Application::STATUS_ACTIVE,
                Application::STATUS_DECLINED,
            ])],
            'assigned_sales_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'decline_reason' => ['sometimes', 'nullable', Rule::in([
                Application::DECLINE_INCOME,
                Application::DECLINE_KYC_BVN,
                Application::DECLINE_ADDRESS,
            ])],
        ]);

        $application->update($validated);

        return redirect()->back()->with('success', 'Application updated.');
    }

    public function destroyApplication(Application $application): RedirectResponse
    {
        $application->delete();

        return redirect()->back()->with('success', 'Application deleted.');
    }

    public function reviewKyc(Application $application): RedirectResponse
    {
        // G6: Guard — ensure both KYC documents are present before advancing
        if (! $application->addressVerified() || ! $application->identityVerified()) {
            throw ValidationException::withMessages([
                'kyc' => 'Both address and identity must be verified before KYC approval.',
            ]);
        }

        // G7: Set a 48-hour e-sign deadline
        $application->update([
            'status' => Application::STATUS_ESIGN_PENDING,
            'esign_expires_at' => now()->addHours(48),
        ]);

        // G13: Notify customer to sign their lease agreement
        $application->user?->notify(new AppNotification(
            subject: 'Action Required: Sign Your AlwaysON Lease Agreement',
            body: 'Your KYC has been approved! Please sign your lease agreement within 48 hours to proceed.',
            level: 'info',
            actionText: 'Sign Now',
            actionUrl: route('dashboard'),
        ));

        return redirect()->back()->with('success', 'KYC approved. Application moved to e-signing.');
    }

    public function declineKyc(Request $request, Application $application): RedirectResponse
    {
        $validated = $request->validate([
            'decline_reason' => ['required', Rule::in([
                Application::DECLINE_INCOME,
                Application::DECLINE_KYC_BVN,
                Application::DECLINE_ADDRESS,
            ])],
            'decline_details' => ['sometimes', 'array'],
        ]);

        $application->update([
            'status' => Application::STATUS_DECLINED,
            'decline_reason' => $validated['decline_reason'],
            'decline_details' => $validated['decline_details'] ?? null,
        ]);

        // G13: Notify customer their application was not successful
        $application->user?->notify(new AppNotification(
            subject: 'Your AlwaysON Application Could Not Be Approved',
            body: 'Unfortunately, your application was not successful at this time. Please contact our support team for more information.',
            level: 'error',
        ));

        return redirect()->back()->with('success', 'Application declined.');
    }

    public function assignInstaller(Request $request, Application $application): RedirectResponse
    {
        $validated = $request->validate([
            'installer_id' => ['required', 'exists:users,id'],
        ]);

        // G12: Check installer workload — max 3 concurrent active tickets
        $activeTickets = InstallerTicket::where('assigned_installer_id', $validated['installer_id'])
            ->whereIn('status', [InstallerTicket::STATUS_PENDING, InstallerTicket::STATUS_IN_PROGRESS])
            ->count();

        if ($activeTickets >= 3) {
            throw ValidationException::withMessages([
                'installer' => 'This installer already has 3 active tickets and cannot take on more work.',
            ]);
        }

        $ticket = InstallerTicket::create([
            'application_id' => $application->id,
            'assigned_installer_id' => $validated['installer_id'],
            'status' => InstallerTicket::STATUS_PENDING,
        ]);

        foreach (InstallationChecklistItem::defaults() as $item) {
            $ticket->checklistItems()->create($item);
        }

        return redirect()->back()->with('success', 'Installer assigned.');
    }

    /**
     * G20: Return the full status change history for an application.
     */
    public function getApplicationHistory(Application $application): JsonResponse
    {
        $history = $application->statusHistories()
            ->with('user:id,name')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'from' => $h->from,
                'to' => $h->to,
                'changedBy' => $h->user->name ?? 'System',
                'notes' => $h->notes,
                'createdAt' => $h->created_at->format('d M Y, H:i'),
            ]);

        return response()->json(['history' => $history]);
    }

    public function payments(): Response
    {
        $payments = Payment::with('application.user')
            ->latest()
            ->take(100)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'customer' => $payment->application->user->name ?? 'Unknown',
                'email' => $payment->application->user->email ?? '',
                'amount' => $payment->amount,
                'status' => $payment->status,
                'reference' => $payment->reference,
                'applicationId' => $payment->application_id,
                'createdAt' => $payment->created_at->diffForHumans(),
            ]);

        return inertia('dashboard/admin/payments', [
            'payments' => $payments,
        ]);
    }

    public function updatePayment(Request $request, Payment $payment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'success', 'failed'])],
        ]);

        $payment->update($validated);

        return redirect()->back()->with('success', 'Payment updated.');
    }

    public function destroyPayment(Payment $payment): RedirectResponse
    {
        $payment->delete();

        return redirect()->back()->with('success', 'Payment deleted.');
    }

    public function users(): Response
    {
        $users = User::latest()
            ->take(100)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'isDisabled' => $user->isDisabled(),
                'emailVerified' => (bool) $user->email_verified_at,
                'phoneVerified' => (bool) $user->phone_verified_at,
                'createdAt' => $user->created_at->diffForHumans(),
            ]);

        return inertia('dashboard/admin/users', [
            'users' => $users,
        ]);
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in([
                User::ROLE_SUPER_ADMIN,
                User::ROLE_SALES,
                User::ROLE_OPERATIONS,
                User::ROLE_INSTALLER,
                User::ROLE_CUSTOMER,
            ])],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->back()->with('success', 'User created.');
    }

    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in([
                User::ROLE_SUPER_ADMIN,
                User::ROLE_SALES,
                User::ROLE_OPERATIONS,
                User::ROLE_INSTALLER,
                User::ROLE_CUSTOMER,
            ])],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'is_disabled' => ['sometimes', 'boolean'],
            'verify_email' => ['sometimes', 'boolean'],
            'verify_phone' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if (! empty($validated['verify_email'])) {
            $user->update(['email_verified_at' => now()]);
        }

        if (! empty($validated['verify_phone'])) {
            $user->update(['phone_verified_at' => now()]);
        }

        return redirect()->back()->with('success', 'User updated.');
    }

    public function destroyUser(User $user): RedirectResponse
    {
        if ($user->isSuperAdmin() && User::where('role', User::ROLE_SUPER_ADMIN)->count() <= 1) {
            throw ValidationException::withMessages([
                'message' => 'Cannot delete the last super admin.',
            ]);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted.');
    }

    public function site(): Response
    {
        $sections = SiteContent::all()
            ->keyBy('section')
            ->map(fn (SiteContent $sc) => $sc->content)
            ->toArray();

        return inertia('dashboard/admin/site', [
            'sections' => $sections,
        ]);
    }

    public function updateSite(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sections' => ['required', 'array'],
            'sections.*.section' => ['required', 'string', 'max:100'],
            'sections.*.content' => ['required'],
        ]);

        foreach ($validated['sections'] as $item) {
            SiteContent::updateOrCreate(
                ['section' => $item['section']],
                ['content' => $item['content']],
            );
        }

        return redirect()->back()->with('success', 'Site content updated.');
    }
}
