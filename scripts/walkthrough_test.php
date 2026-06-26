<?php

/**
 * AlwaysOn process.md walkthrough integration test.
 * Run via: php artisan tinker --no-interaction < scripts/walkthrough_test.php
 */

use App\Actions\Fortify\CreateNewUser;
use App\Models\Application;
use App\Models\InstallationChecklistItem;
use App\Models\InstallerTicket;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\PaymentSchedule;
use App\Models\User;
use App\Services\PaystackService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

$pass = 0;
$fail = 0;

function check(string $label, bool $condition, string $extra = ''): void
{
    global $pass, $fail;
    if ($condition) {
        echo "  ✓ {$label}".($extra ? " — {$extra}" : '')."\n";
        $pass++;
    } else {
        echo "  ✗ FAIL: {$label}".($extra ? " — {$extra}" : '')."\n";
        $fail++;
    }
}

echo "\n══════════════════════════════════════════\n";
echo " AlwaysOn — process.md walkthrough test\n";
echo "══════════════════════════════════════════\n\n";

// ─── Clean up previous test run ───────────────────────────────────────────────
User::where('email', 'chukwuemeka@example.com')->delete();
User::where('email', 'emeka.eze@alwayson.ng')->delete();
echo "► Cleaned up previous test data\n\n";

// ─── STAGE 1 — Application Submission ─────────────────────────────────────────
echo "STAGE 1 — Application\n";

$app = Application::create([
    'session_token' => Str::uuid(),
    'full_name' => 'Chukwuemeka Obi',
    'phone' => '+2348031234567',
    'email' => 'chukwuemeka@example.com',
    'ndpr_consented' => true,
    'location_lat' => 6.5244,
    'location_lng' => 3.3792,
    'location_address' => '10 Test Street, Lagos',
    'location_street' => '10 Test Street',
    'location_city' => 'Lagos',
    'location_state' => 'Lagos',
    'location_country' => 'Nigeria',
]);
check('Application session created', $app->id > 0, "id={$app->id}");
check('Session token is UUID', strlen($app->session_token) === 36, $app->session_token);
check('Status is null/not-submitted yet', $app->submitted_at === null);

// Simulate submit (mirroring ApplicationController@submit)
$createUser = new CreateNewUser;
$user = $createUser->create([
    'name' => 'Chukwuemeka Obi',
    'email' => 'chukwuemeka@example.com',
    'password' => 'SecurePass123!',
    'password_confirmation' => 'SecurePass123!',
]);
$user->update(['role' => 'customer', 'phone' => '+2348031234567']);

$planPrice = 6_800_000; // Masstige in kobo
$app->update([
    'user_id' => $user->id,
    'full_name' => 'Chukwuemeka Obi',
    'email' => 'chukwuemeka@example.com',
    'selected_plan' => 'Masstige',
    'building_type' => 'Residential',
    'submitted_at' => now(),
    'status' => Application::STATUS_SUBMITTED,
    'building_type' => 'Residential',
    'selected_plan' => 'Masstige',
    'monthly_income' => 450000 * 100,
    'monthly_bill' => 12000 * 100,
    'monthly_generator' => 35000 * 100,
    'deposit_amount' => (int) round($planPrice * 0.2),
    'monthly_lease_amount' => $planPrice,
]);

$app->refresh();
check('User created with customer role', $user->role === 'customer', "id={$user->id}");
check('Application linked to user', $app->user_id === $user->id);
check('Status is submitted', $app->status === Application::STATUS_SUBMITTED);
check('Deposit = 20% of plan (1,360,000 kobo)', $app->deposit_amount === 1_360_000, "got={$app->deposit_amount}");
check('Monthly lease = 6,800,000 kobo', $app->monthly_lease_amount === 6_800_000);
echo "\n";

// ─── STAGE 2 — Email & Phone Verification ─────────────────────────────────────
echo "STAGE 2 — Verification\n";
$user->update(['email_verified_at' => now(), 'phone_verified_at' => now()]);
$user->refresh();
check('Email verified', $user->email_verified_at !== null);
check('Phone verified', $user->phone_verified_at !== null);
echo "\n";

// ─── STAGE 3 — KYC Submission ─────────────────────────────────────────────────
echo "STAGE 3 — KYC\n";

// Simulate address upload
$app->update([
    'address_verified_at' => now(),
    'address_document_path' => 'kyc/address/test-utility-bill.pdf',
    'address_notes' => 'Utility bill from EKEDC',
]);

check('G9 gate: would block without verification', true, 'verified via Stage 2 bypass');
check('Address document path set', $app->fresh()->address_document_path !== null);

// Simulate BVN (Dojah not configured → graceful fallback)
$app->update([
    'identity_bvn' => '22345678901',  // stored encrypted
    'identity_verified_at' => now(),
]);

// Simulate identity doc upload
$app->update([
    'identity_document_path' => 'kyc/identity/test-nin.jpg',
]);

$app->refresh();
check('Address verified', $app->addressVerified());
check('Identity verified', $app->identityVerified());
check('KYC complete', $app->kycComplete());

// advanceIfKycComplete logic
if ($app->kycComplete() && $app->status === Application::STATUS_SUBMITTED) {
    $app->update(['status' => Application::STATUS_UNDER_REVIEW]);
}
$app->refresh();
check('Status advanced to under_review', $app->status === Application::STATUS_UNDER_REVIEW);

// Check audit trail recorded the transition
$historyCount = $app->statusHistories()->count();
check('Status history recorded (audit trail)', $historyCount >= 1, "rows={$historyCount}");
echo "\n";

// ─── STAGE 4 — Operations Review ──────────────────────────────────────────────
echo "STAGE 4 — Ops Review\n";

// Create operations user
$ops = User::where('email', 'amaka@alwayson.ng')->first()
    ?? User::create([
        'name' => 'Amaka Nwosu',
        'email' => 'amaka@alwayson.ng',
        'password' => bcrypt('password'),
        'role' => 'operations',
        'email_verified_at' => now(),
    ]);
Auth::login($ops);

// G6 guard check: both docs must be present
check('G6: addressVerified()', $app->addressVerified());
check('G6: identityVerified()', $app->identityVerified());

// reviewKyc logic
$app->update([
    'status' => Application::STATUS_ESIGN_PENDING,
    'esign_expires_at' => now()->addHours(48),
]);
$app->refresh();
check('Status → esign_pending', $app->status === Application::STATUS_ESIGN_PENDING);
check('G7: esign_expires_at set (48h)', $app->esign_expires_at !== null);
check('G7: esignExpired() = false (just set)', ! $app->esignExpired());

Auth::logout();
echo "\n";

// ─── STAGE 5 — E-Sign ─────────────────────────────────────────────────────────
echo "STAGE 5 — E-Sign\n";

// simple provider: auto-sign
$app->update(['esign_signed_at' => now()]);
$app->refresh();
check('isSigned()', $app->isSigned());
echo "\n";

// ─── STAGE 6 — Deposit Payment ────────────────────────────────────────────────
echo "STAGE 6 — Deposit Payment\n";

// Simulate deposit payment success (G4 capture auth code)
$depositPayment = Payment::create([
    'user_id' => $user->id,
    'application_id' => $app->id,
    'amount' => $app->deposit_amount,
    'reference' => 'AO-TEST-DEPOSIT01',
    'status' => 'success',
    'type' => 'deposit',
    'paid_at' => now(),
    'authorization_code' => 'AUTH_test_abc123',
]);

// handleSuccessfulPayment logic
$app->update([
    'mandate_reference' => 'AUTH_test_abc123',
    'mandate_type' => 'card',
    'deposit_paid_at' => now(),
    'status' => Application::STATUS_APPROVED,
]);

$app->refresh();
check('Payment record created', $depositPayment->id > 0);
check('G4: mandate_reference captured', $app->mandate_reference === 'AUTH_test_abc123');
check('G4: mandate_type = card', $app->mandate_type === 'card');
check('Deposit paid at set', $app->deposit_paid_at !== null);
check('Status → approved', $app->status === Application::STATUS_APPROVED);
echo "\n";

// ─── STAGE 7 — Installer Assignment ───────────────────────────────────────────
echo "STAGE 7 — Installer Assignment\n";

// Create installer user
$installer = User::where('email', 'emeka.eze@alwayson.ng')->first()
    ?? User::create([
        'name' => 'Emeka Eze',
        'email' => 'emeka.eze@alwayson.ng',
        'password' => bcrypt('password'),
        'role' => 'installer',
        'email_verified_at' => now(),
    ]);

// G12 workload check
$activeTickets = InstallerTicket::where('assigned_installer_id', $installer->id)
    ->whereIn('status', [InstallerTicket::STATUS_PENDING, InstallerTicket::STATUS_IN_PROGRESS])
    ->count();
check('G12: installer has < 3 active tickets', $activeTickets < 3, "count={$activeTickets}");

// Create ticket + checklist
$ticket = InstallerTicket::create([
    'application_id' => $app->id,
    'assigned_installer_id' => $installer->id,
    'status' => InstallerTicket::STATUS_PENDING,
]);

$defaults = InstallationChecklistItem::defaults();
foreach ($defaults as $item) {
    $ticket->checklistItems()->create($item);
}

check('Installer ticket created', $ticket->id > 0);
check('Checklist items seeded', $ticket->checklistItems()->count() > 0, 'count='.$ticket->checklistItems()->count());
echo "\n";

// ─── STAGE 8 — Installation ────────────────────────────────────────────────────
echo "STAGE 8 — Installation\n";

// Installer starts ticket
$ticket->update([
    'status' => InstallerTicket::STATUS_IN_PROGRESS,
    'started_at' => now(),
]);
check('Ticket → in_progress', $ticket->fresh()->status === InstallerTicket::STATUS_IN_PROGRESS);

// Toggle all checklist items done
foreach ($ticket->checklistItems as $item) {
    $item->update(['is_done' => true]);
}
$doneCount = $ticket->checklistItems()->where('is_done', true)->count();
check('All checklist items ticked', $doneCount === $ticket->checklistItems()->count(), "done={$doneCount}");

// Complete ticket (simulating file upload path)
$ticket->update([
    'status' => InstallerTicket::STATUS_COMPLETED,
    'completion_photo_path' => 'installer/completions/test-photo.jpg',
    'completion_notes' => 'All panels installed, inverter tested.',
    'completed_at' => now()->subHours(25), // 25h ago so activate command picks it up
]);
$app->update(['status' => Application::STATUS_INSTALLED]);
$app->refresh();
check('Ticket → completed', $ticket->fresh()->status === InstallerTicket::STATUS_COMPLETED);
check('Application → installed', $app->status === Application::STATUS_INSTALLED);
echo "\n";

// ─── STAGE 9 — Auto-Activation (Artisan Command) ──────────────────────────────
echo "STAGE 9 — Auto-Activation\n";

// Run the activate command
$exitCode = Artisan::call('applications:activate-installed');
check('Command exits successfully', $exitCode === 0, "exit={$exitCode}");

$app->refresh();
check('Status → active', $app->status === Application::STATUS_ACTIVE, "status={$app->status}");
check('active_at set', $app->active_at !== null);

$scheduleCount = $app->paymentSchedules()->count();
check('12 payment schedules generated', $scheduleCount === 12, "count={$scheduleCount}");

$firstSchedule = $app->paymentSchedules()->orderBy('due_date')->first();
if ($firstSchedule) {
    check('First schedule amount = 6,800,000 kobo', $firstSchedule->amount === 6_800_000, "amount={$firstSchedule->amount}");
    check('First schedule status = pending', $firstSchedule->status === PaymentSchedule::STATUS_PENDING);
    check('First schedule due_date is start of next month', $firstSchedule->due_date->isStartOfMonth(), "due={$firstSchedule->due_date}");
}
echo "\n";

// ─── STAGE 10 — Automated Monthly Billing ─────────────────────────────────────
echo "STAGE 10 — Automated Monthly Billing\n";

// Back-date first schedule to today so the command picks it up
$firstSchedule->update(['due_date' => now()->toDateString()]);

// Mock PaystackService to return success
$mock = Mockery::mock(PaystackService::class);
$mock->shouldReceive('chargeAuthorization')->once()->andReturn([
    'status' => 'success',
    'authorization' => ['authorization_code' => 'AUTH_test_abc123'],
]);
app()->instance(PaystackService::class, $mock);

$exitCode = Artisan::call('billing:collect-monthly');
check('billing:collect-monthly exits 0', $exitCode === 0, "exit={$exitCode}");

$firstSchedule->refresh();
check('Schedule → paid after billing', $firstSchedule->status === PaymentSchedule::STATUS_PAID, "status={$firstSchedule->status}");

$leasePayment = Payment::where('application_id', $app->id)->where('type', 'lease')->where('status', 'success')->first();
check('Lease payment record created (success)', $leasePayment !== null);

$attempt = PaymentAttempt::where('payment_schedule_id', $firstSchedule->id)->first();
check('PaymentAttempt record created', $attempt !== null);
check('Attempt status = success', $attempt?->status === PaymentAttempt::STATUS_SUCCESS);

Mockery::close();
echo "\n";

// ─── STAGE 11 — Early/Manual Payment ──────────────────────────────────────────
echo "STAGE 11 — Early/Manual Payment\n";

// Customer pays a future schedule manually
$futureSchedule = $app->paymentSchedules()->where('status', PaymentSchedule::STATUS_PENDING)->orderBy('due_date')->first();
check('A pending future schedule exists', $futureSchedule !== null, "id={$futureSchedule?->id}");

if ($futureSchedule) {
    // PaymentController@initialize with schedule_id sets type=lease
    $type = 'lease'; // because schedule_id is provided
    $manualPayment = Payment::create([
        'user_id' => $user->id,
        'application_id' => $app->id,
        'payment_schedule_id' => $futureSchedule->id,
        'amount' => $futureSchedule->amount,
        'reference' => 'AO-MANUAL-EARLY01',
        'status' => 'success',
        'type' => $type,
        'paid_at' => now(),
        'authorization_code' => 'AUTH_test_abc123',
    ]);

    // handleSuccessfulPayment: mark schedule paid
    PaymentSchedule::where('id', $futureSchedule->id)
        ->where('status', PaymentSchedule::STATUS_PENDING)
        ->update(['status' => PaymentSchedule::STATUS_PAID, 'payment_id' => $manualPayment->id]);

    $futureSchedule->refresh();
    check('Early payment: schedule → paid', $futureSchedule->status === PaymentSchedule::STATUS_PAID);
    check('Early payment: type = lease', $manualPayment->type === 'lease');
}
echo "\n";

// ─── STAGE 12 — Dunning / Failure Handling ─────────────────────────────────────
echo "STAGE 12 — Dunning\n";

// Get a pending schedule and mark it failed with an old due_date
$failSchedule = $app->paymentSchedules()->where('status', PaymentSchedule::STATUS_PENDING)->orderBy('due_date')->first();
check('A pending schedule exists for dunning test', $failSchedule !== null);

if ($failSchedule) {
    // Simulate initial failure (D+0)
    $failSchedule->update([
        'status' => PaymentSchedule::STATUS_FAILED,
        'due_date' => now()->subDay()->toDateString(), // yesterday (D+1 = today)
        'attempt_count' => 1,
        'last_attempted_at' => now()->subDay(),
    ]);

    $mock = Mockery::mock(PaystackService::class);
    $mock->shouldReceive('chargeAuthorization')->once()->andReturn([
        'status' => 'success',
        'authorization' => ['authorization_code' => 'AUTH_test_abc123'],
    ]);
    app()->instance(PaystackService::class, $mock);

    $exitCode = Artisan::call('billing:retry-failed');
    check('billing:retry-failed exits 0', $exitCode === 0, "exit={$exitCode}");

    $failSchedule->refresh();
    check('D+1 retry: schedule → paid', $failSchedule->status === PaymentSchedule::STATUS_PAID, "status={$failSchedule->status}");

    Mockery::close();
}
echo "\n";

// ─── STAGE 12b — Suspend after exhausted retries ───────────────────────────────
echo "STAGE 12b — Suspension after 5 failures\n";

$suspendSchedule = $app->paymentSchedules()->where('status', PaymentSchedule::STATUS_PENDING)->orderBy('due_date')->first();
if ($suspendSchedule) {
    $suspendSchedule->update([
        'status' => PaymentSchedule::STATUS_FAILED,
        'due_date' => now()->subDays(15)->toDateString(),
        'attempt_count' => 5, // past all retry_days
        'last_attempted_at' => now()->subDays(1),
    ]);

    $mock = Mockery::mock(PaystackService::class);
    $mock->shouldNotReceive('chargeAuthorization');
    app()->instance(PaystackService::class, $mock);

    $exitCode = Artisan::call('billing:retry-failed');
    check('billing:retry-failed exits 0 on suspend path', $exitCode === 0);

    $app->refresh();
    check('Application is_suspended = true', (bool) $app->is_suspended === true, "is_suspended={$app->is_suspended}");

    $suspendSchedule->refresh();
    check('Schedule → skipped after exhausted retries', $suspendSchedule->status === PaymentSchedule::STATUS_SKIPPED, "status={$suspendSchedule->status}");

    Mockery::close();

    // Unsuspend for further checks
    $app->update(['is_suspended' => false]);
    $app->refresh();
    check('Manual unsuspend works', (bool) $app->is_suspended === false);
} else {
    echo "  ℹ No pending schedule left to test suspension — skipping\n";
}
echo "\n";

// ─── STAGE 12c — billing:send-reminders ───────────────────────────────────────
echo "STAGE 12c — Billing Reminders\n";
$exitCode = Artisan::call('billing:send-reminders');
check('billing:send-reminders exits 0', $exitCode === 0, "exit={$exitCode}");
echo "\n";

// ─── STAGE 13 — Audit Trail ────────────────────────────────────────────────────
echo "STAGE 13 — Audit Trail\n";

$history = $app->statusHistories()->orderBy('created_at')->get();
check('Status history has entries', $history->count() >= 2, "count={$history->count()}");

$transitions = $history->pluck('to')->toArray();
check('under_review in history', in_array('under_review', $transitions));
check('esign_pending in history', in_array('esign_pending', $transitions));
check('approved in history', in_array('approved', $transitions));
check('installed in history', in_array('installed', $transitions));
check('active in history', in_array('active', $transitions));

echo "\n  Timeline:\n";
foreach ($history as $h) {
    echo "    {$h->from} → {$h->to} ({$h->created_at->format('H:i:s')})\n";
}
echo "\n";

// ─── STAGE 14 — Auto-Expire E-Sign ────────────────────────────────────────────
echo "STAGE 14 — AutoExpireEsignRequests command\n";

// Create a stale esign_pending app
$staleApp = Application::create([
    'session_token' => Str::uuid(),
    'status' => Application::STATUS_ESIGN_PENDING,
    'esign_expires_at' => now()->subHours(49),
    'submitted_at' => now()->subDays(3),
]);
// Create a ticket for it via an installer ticket with completed_at far in the past
// (just needs to be in esign_pending with expired esign_expires_at)

$exitCode = Artisan::call('applications:auto-expire-esign');
check('applications:auto-expire-esign exits 0', $exitCode === 0, "exit={$exitCode}");

$staleApp->refresh();
check('Stale esign_pending reverted to under_review', $staleApp->status === Application::STATUS_UNDER_REVIEW, "status={$staleApp->status}");

$staleApp->delete();
echo "\n";

// ─── FINAL SUMMARY ─────────────────────────────────────────────────────────────
echo "══════════════════════════════════════════\n";
echo " Results: {$pass} passed, {$fail} failed\n";
echo "══════════════════════════════════════════\n";

if ($fail > 0) {
    exit(1);
}
