<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationAppliance;
use App\Models\InstallerTicket;
use App\Models\Payment;
use App\Models\PaymentSchedule;
use App\Models\User;
use App\Services\Signing\SigningService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly SigningService $signing,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->isCustomer()) {
            return $this->customerDashboard($user);
        }

        if ($user->isSuperAdmin()) {
            return $this->adminDashboard();
        }

        if ($user->isSales()) {
            return $this->salesDashboard($user);
        }

        if ($user->isOperations()) {
            return $this->operationsDashboard();
        }

        if ($user->isInstaller()) {
            return $this->installerDashboard($user);
        }

        return inertia('dashboard/customer/index', []);
    }

    public function showApplication(Request $request): Response
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return inertia('dashboard/customer/application', [
                'application' => null,
            ]);
        }

        $appliances = $application->appliances()->get()->map(fn ($a) => [
            'label' => $a->label,
            'quantity' => $a->quantity,
            'watts' => $a->watts_per_unit,
        ])->values()->toArray();

        return inertia('dashboard/customer/application', [
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'plan' => $application->selected_plan,
                'fullName' => $application->full_name,
                'email' => $application->email,
                'phone' => $application->phone,
                'ndprConsented' => (bool) $application->ndpr_consented,
                'buildingType' => $application->building_type,
                'appliances' => $appliances,
                'totalLoadWatts' => $application->total_load_watts,
                'monthlyIncome' => $application->monthly_income
                    ? number_format($application->monthly_income / 100)
                    : null,
                'monthlyBill' => $application->monthly_bill
                    ? number_format($application->monthly_bill / 100)
                    : null,
                'monthlyGenerator' => $application->monthly_generator
                    ? number_format($application->monthly_generator / 100)
                    : null,
                'location' => $application->location_lat ? [
                    'lat' => (float) $application->location_lat,
                    'lng' => (float) $application->location_lng,
                    'formattedAddress' => $application->location_address,
                    'street' => $application->location_street,
                    'city' => $application->location_city,
                    'state' => $application->location_state,
                    'country' => $application->location_country,
                ] : null,
                'billingAddress' => $application->billing_street ? [
                    'street' => $application->billing_street,
                    'city' => $application->billing_city,
                    'state' => $application->billing_state,
                    'country' => $application->billing_country,
                ] : null,
                'depositAmount' => $application->deposit_amount,
                'monthlyLease' => $application->monthly_lease_amount,
                'submittedAt' => optional($application->submitted_at)->diffForHumans(),
            ],
        ]);
    }

    public function showVerification(Request $request): Response
    {
        $user = $request->user();

        return inertia('dashboard/customer/verification', [
            'verification' => [
                'emailVerified' => (bool) $user->email_verified_at,
                'phoneVerified' => (bool) $user->phone_verified_at,
                'phone' => $user->phone,
            ],
        ]);
    }

    public function showPayments(Request $request): Response
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        // G17: Include billing schedules for the "My Bills" page
        $schedules = [];
        if ($application) {
            $schedules = $application->paymentSchedules()
                ->orderBy('due_date')
                ->get()
                ->map(fn (PaymentSchedule $s) => [
                    'id' => $s->id,
                    'dueDate' => $s->due_date->format('d M Y'),
                    'amount' => $s->amount,
                    'status' => $s->status,
                    'attemptCount' => $s->attempt_count,
                    'lastAttemptedAt' => $s->last_attempted_at?->diffForHumans(),
                ])
                ->toArray();
        }

        return inertia('dashboard/customer/payments', [
            'application' => $application ? [
                'id' => $application->id,
                'status' => $application->status,
                'plan' => $application->selected_plan,
                'isSuspended' => (bool) $application->is_suspended, // G3
            ] : null,
            'deposit' => $application ? [
                'amount' => $application->deposit_amount,
                'paid' => $application->depositPaid(),
                'paidAt' => optional($application->deposit_paid_at)->format('d M Y'),
            ] : null,
            'lease' => $application ? [
                'monthly' => $application->monthly_lease_amount,
            ] : null,
            'esign' => $application ? [
                'provider' => $this->signing->getProviderName(),
                'signed' => $application->isSigned(),
                'signedAt' => optional($application->esign_signed_at)->format('d M Y'),
                'reference' => $application->esign_reference,
                'url' => $application->esign_reference
                    ? $this->signing->getSigningUrl($application->esign_reference)
                    : null,
            ] : null,
            'schedules' => $schedules, // G17: billing schedule rows
        ]);
    }

    public function acceptEsign(Request $request): RedirectResponse
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return redirect()->back()->with('error', 'No application found.');
        }

        if ($application->isSigned()) {
            return redirect()->back()->with('error', 'Already signed.');
        }

        if ($application->status !== Application::STATUS_ESIGN_PENDING) {
            return redirect()->back()->with('error', 'E-signing is not available at this stage.');
        }

        $reference = $this->signing->sendForSignature($user, $application);
        $url = $this->signing->getSigningUrl($reference);

        if ($this->signing->getProviderName() === 'simple') {
            $application->update(['esign_signed_at' => now()]);

            return redirect()->back()->with('success', 'Agreement signed.');
        }

        return redirect()->away($url);
    }

    private function customerDashboard(User $user): Response
    {
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return inertia('dashboard/customer', [
                'application' => null,
                'deposit' => null,
                'lease' => null,
                'esign' => null,
                'verification' => [
                    'emailVerified' => (bool) $user->email_verified_at,
                    'phoneVerified' => (bool) $user->phone_verified_at,
                    'phone' => $user->phone,
                ],
                'kyc' => null,
                'declineInfo' => null,
            ]);
        }

        $appliances = $application->appliances()->get()->map(fn ($a) => [
            'label' => $a->label,
            'quantity' => $a->quantity,
            'watts' => $a->watts_per_unit,
        ])->values()->toArray();

        $declineInfo = null;
        if ($application->isDeclined()) {
            $declineInfo = [
                'reason' => $application->decline_reason,
                'details' => $application->decline_details,
                'canRetry' => optional($application->submitted_at)->addDays(30)->isPast() ?? false,
            ];
        }

        $ticket = $application->installerTicket;

        return inertia('dashboard/customer/index', [
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'plan' => $application->selected_plan,
                'buildingType' => $application->building_type,
                'appliances' => $appliances,
                'totalLoadWatts' => $application->total_load_watts,
                'monthlyIncome' => $application->monthly_income
                    ? number_format($application->monthly_income / 100)
                    : null,
                'monthlyBill' => $application->monthly_bill
                    ? number_format($application->monthly_bill / 100)
                    : null,
                'monthlyGenerator' => $application->monthly_generator
                    ? number_format($application->monthly_generator / 100)
                    : null,
                'location' => $application->location_lat ? [
                    'lat' => (float) $application->location_lat,
                    'lng' => (float) $application->location_lng,
                    'formattedAddress' => $application->location_address,
                    'street' => $application->location_street,
                    'city' => $application->location_city,
                    'state' => $application->location_state,
                    'country' => $application->location_country,
                ] : null,
                'billingAddress' => [
                    'street' => $application->billing_street,
                    'city' => $application->billing_city,
                    'state' => $application->billing_state,
                    'country' => $application->billing_country,
                ],
                'submittedAt' => optional($application->submitted_at)->diffForHumans(),
            ],
            'deposit' => [
                'amount' => $application->deposit_amount,
                'paid' => $application->depositPaid(),
            ],
            'lease' => [
                'monthly' => $application->monthly_lease_amount,
            ],
            'esign' => [
                'provider' => $this->signing->getProviderName(),
                'signed' => $application->isSigned(),
                'url' => $application->esign_reference
                    ? $this->signing->getSigningUrl($application->esign_reference)
                    : null,
            ],
            'verification' => [
                'emailVerified' => (bool) $user->email_verified_at,
                'phoneVerified' => (bool) $user->phone_verified_at,
                'phone' => $user->phone,
            ],
            'kyc' => [
                'addressVerified' => $application->addressVerified(),
                'identityVerified' => $application->identityVerified(),
                'identityBvnPrefix' => $application->identity_bvn ? substr($application->identity_bvn, 0, 4).'*******' : null,
            ],
            'installerTicket' => $ticket ? [
                'status' => $ticket->status,
                'completionPhotoPath' => $ticket->completion_photo_path,
                'completionNotes' => $ticket->completion_notes,
                'installerName' => $ticket->assignedInstaller?->name,
            ] : null,
            'declineInfo' => $declineInfo,
            'isSuspended' => (bool) $application->is_suspended, // G3: show suspension banner
        ]);
    }

    /** @return array<string, mixed> */
    private function mapApplicationRow(Application $app): array
    {
        return [
            'id' => $app->id,
            'name' => $app->user->name ?? 'Unknown',
            'email' => $app->user->email ?? '',
            'phone' => $app->user->phone ?? '',
            'status' => $app->status,
            'plan' => $app->selected_plan,
            'buildingType' => $app->building_type,
            'submittedAt' => optional($app->submitted_at)->diffForHumans(),
        ];
    }

    private function adminDashboard(): Response
    {
        $recentApplications = Application::with('user')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Application $app): array => $this->mapApplicationRow($app));

        $statusCounts = Application::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $roleCounts = User::selectRaw('role, COUNT(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role');

        $totalRevenue = Payment::where('status', 'success')->sum('amount');

        return inertia('dashboard/admin', [
            'stats' => [
                'totalApplications' => (int) $statusCounts->sum(),
                'pendingKyc' => ((int) ($statusCounts['address_verification'] ?? 0)) + ((int) ($statusCounts['identity_verification'] ?? 0)),
                'underReview' => (int) ($statusCounts['under_review'] ?? 0),
                'esignPending' => (int) ($statusCounts['esign_pending'] ?? 0),
                'approved' => (int) ($statusCounts['approved'] ?? 0),
                'installed' => (int) ($statusCounts['installed'] ?? 0),
                'active' => (int) ($statusCounts['active'] ?? 0),
                'declined' => (int) ($statusCounts['declined'] ?? 0),
                'totalCustomers' => (int) ($roleCounts[User::ROLE_CUSTOMER] ?? 0),
                'totalInstallers' => (int) ($roleCounts[User::ROLE_INSTALLER] ?? 0),
                'totalRevenue' => $totalRevenue,
            ],
            'recentApplications' => $recentApplications,
        ]);
    }

    private function salesDashboard(User $user): Response
    {
        $customers = Application::where('assigned_sales_id', $user->id)
            ->with('user')
            ->latest()
            ->get()
            ->map(fn (Application $app): array => $this->mapApplicationRow($app));

        $pipelineCounts = Application::selectRaw('status, COUNT(*) as count')
            ->where('assigned_sales_id', $user->id)
            ->groupBy('status')
            ->pluck('count', 'status');

        return inertia('dashboard/sales', [
            'customers' => $customers,
            'pipeline' => [
                'submitted' => (int) ($pipelineCounts[Application::STATUS_SUBMITTED] ?? 0),
                'addressVerification' => (int) ($pipelineCounts[Application::STATUS_ADDRESS_VERIFICATION] ?? 0),
                'identityVerification' => (int) ($pipelineCounts[Application::STATUS_IDENTITY_VERIFICATION] ?? 0),
                'underReview' => (int) ($pipelineCounts[Application::STATUS_UNDER_REVIEW] ?? 0),
                'esignPending' => (int) ($pipelineCounts[Application::STATUS_ESIGN_PENDING] ?? 0),
                'approved' => (int) ($pipelineCounts[Application::STATUS_APPROVED] ?? 0),
                'installed' => (int) ($pipelineCounts[Application::STATUS_INSTALLED] ?? 0),
                'active' => (int) ($pipelineCounts[Application::STATUS_ACTIVE] ?? 0),
            ],
        ]);
    }

    private function operationsDashboard(): Response
    {
        $pendingKyc = Application::whereIn('status', [
            Application::STATUS_ADDRESS_VERIFICATION,
            Application::STATUS_IDENTITY_VERIFICATION,
            Application::STATUS_UNDER_REVIEW,
        ])->with('user')->latest()->take(20)->get()
            ->map(fn (Application $app): array => $this->mapApplicationRow($app));

        return inertia('dashboard/operations', [
            'pendingKyc' => $pendingKyc,
        ]);
    }

    private function installerDashboard(User $user): Response
    {
        $tickets = $user->installerTickets()
            ->with(['application.user', 'application.appliances', 'checklistItems'])
            ->latest()
            ->get()
            ->map(fn (InstallerTicket $ticket) => [
                'id' => $ticket->id,
                'customerName' => $ticket->application->user->name,
                'customerEmail' => $ticket->application->user->email,
                'customerPhone' => $ticket->application->user->phone,
                'customerAddress' => $ticket->application->location_address
                    ? [
                        'formattedAddress' => $ticket->application->location_address,
                        'street' => $ticket->application->location_street,
                        'city' => $ticket->application->location_city,
                        'state' => $ticket->application->location_state,
                        'country' => $ticket->application->location_country,
                    ]
                    : null,
                'plan' => $ticket->application->selected_plan,
                'status' => $ticket->status,
                'notes' => $ticket->notes,
                'appliances' => $ticket->application->appliances->map(fn (ApplicationAppliance $a) => [
                    'label' => $a->label,
                    'quantity' => $a->quantity,
                    'watts' => $a->watts_per_unit,
                ]),
                'startedAt' => $ticket->started_at?->diffForHumans(),
                'completedAt' => $ticket->completed_at?->diffForHumans(),
                'completionPhotoPath' => $ticket->completion_photo_path
                    ? Storage::url($ticket->completion_photo_path) : null,
                'completionNotes' => $ticket->completion_notes,
                'createdAt' => $ticket->created_at->diffForHumans(),
                'checklistDone' => $ticket->checklistItems->where('is_done', true)->count(),
                'checklistTotal' => $ticket->checklistItems->count(),
            ]);

        return inertia('dashboard/installer/index', [
            'tickets' => $tickets,
            'stats' => $user->installerTickets()
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->pipe(fn ($counts) => [
                    'pending' => (int) ($counts[InstallerTicket::STATUS_PENDING] ?? 0),
                    'inProgress' => (int) ($counts[InstallerTicket::STATUS_IN_PROGRESS] ?? 0),
                    'completed' => (int) ($counts[InstallerTicket::STATUS_COMPLETED] ?? 0),
                ]),
        ]);
    }
}
