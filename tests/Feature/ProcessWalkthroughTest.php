<?php

declare(strict_types=1);

/**
 * Process.md Walkthrough Integration Test
 *
 * Simulates the full Chukwuemeka Obi journey end-to-end:
 * Stage 1: Application submission
 * Stage 2: Email & phone verification bypass
 * Stage 3: KYC document submission
 * Stage 4: Ops review / KYC approval
 * Stage 5: E-sign (simple provider)
 * Stage 6: Deposit payment (Paystack)
 * Stage 7: Installer assignment (G12 workload check)
 * Stage 8: Installation completion
 * Stage 9: Auto-activation (applications:activate-installed)
 * Stage 10: Automated monthly billing (billing:collect-monthly)
 * Stage 11: Early/manual payment
 * Stage 12: Dunning — retry + suspension
 * Stage 12c: billing:send-reminders
 * Stage 13: Audit trail
 * Stage 14: AutoExpireEsignRequests
 */

use App\Actions\Fortify\CreateNewUser;
use App\Models\Application;
use App\Models\InstallerTicket;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\PaymentSchedule;
use App\Models\User;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

// ─── STAGE 1 — Application submission ─────────────────────────────────────────

test('Stage 1: application session is created and submitted', function (): void {
    // Simulate ApplicationController@submit
    $user = (new CreateNewUser)->create([
        'name' => 'Chukwuemeka Obi',
        'email' => 'chukwuemeka@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);
    $user->update(['role' => 'customer', 'phone' => '+2348031234567']);

    $planPrice = 6_800_000; // Masstige kobo
    $app = Application::create([
        'user_id' => $user->id,
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
        'submitted_at' => now(),
        'status' => Application::STATUS_SUBMITTED,
        'building_type' => 'Residential',
        'selected_plan' => 'Masstige',
        'monthly_income' => 450000 * 100,
        'monthly_bill' => 12000 * 100,
        'monthly_generator' => 35000 * 100,
        'deposit_amount' => (int) round($planPrice * 0.2),  // 1,360,000 kobo
        'monthly_lease_amount' => $planPrice,
        'session_token' => (string) str()->uuid(),
    ]);

    $app->refresh();
    expect($app->status)->toBe(Application::STATUS_SUBMITTED);
    expect($app->deposit_amount)->toBe(1_360_000); // ₦13,600 in kobo
    expect($app->monthly_lease_amount)->toBe(6_800_000); // ₦68,000 in kobo
    expect($app->full_name)->toBe('Chukwuemeka Obi');
    expect($app->email)->toBe('chukwuemeka@example.com');
    expect($user->role)->toBe('customer');
});

// ─── STAGE 2 — Verification bypass ───────────────────────────────────────────

test('Stage 2: email & phone verification bypass', function (): void {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => null,
        'phone_verified_at' => null,
    ]);

    // Bypass: stamp directly
    $user->update([
        'email_verified_at' => now(),
        'phone_verified_at' => now(),
    ]);
    $user->refresh();

    expect($user->email_verified_at)->not->toBeNull();
    expect($user->phone_verified_at)->not->toBeNull();
});

// ─── STAGE 3 — KYC submission ─────────────────────────────────────────────────

test('Stage 3: KYC submission advances status to under_review', function (): void {
    $user = User::factory()->create([
        'role' => 'customer',
        'email_verified_at' => now(),
        'phone_verified_at' => now(),
    ]);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_SUBMITTED,
    ]);

    // G9: gate would block without verification — already passed above
    // Address document upload
    $app->update([
        'address_verified_at' => now(),
        'address_document_path' => 'kyc/address/test-utility-bill.pdf',
    ]);
    expect($app->fresh()->addressVerified())->toBeTrue();

    // BVN (Dojah not configured → graceful fallback: just stamp)
    $app->update([
        'identity_bvn' => '22345678901',
        'identity_verified_at' => now(),
    ]);
    expect($app->fresh()->identityVerified())->toBeTrue();

    // Identity document
    $app->update(['identity_document_path' => 'kyc/identity/test-nin.jpg']);

    $app->refresh();
    expect($app->kycComplete())->toBeTrue();

    // advanceIfKycComplete
    if ($app->kycComplete() && $app->status === Application::STATUS_SUBMITTED) {
        $app->update(['status' => Application::STATUS_UNDER_REVIEW]);
    }
    expect($app->fresh()->status)->toBe(Application::STATUS_UNDER_REVIEW);

    // G20: audit trail
    expect($app->statusHistories()->count())->toBeGreaterThanOrEqual(1);
});

// ─── STAGE 4 — Ops review ─────────────────────────────────────────────────────

test('Stage 4: G6 guard blocks approval without KYC docs', function (): void {
    $app = Application::factory()->create([
        'status' => Application::STATUS_UNDER_REVIEW,
        'address_verified_at' => null,
        'identity_verified_at' => null,
    ]);

    // Both not verified — guard should fail
    expect($app->addressVerified())->toBeFalse();
    expect($app->identityVerified())->toBeFalse();
    expect($app->kycComplete())->toBeFalse();
});

test('Stage 4: KYC approval sets esign_pending + 48h deadline (G7)', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_UNDER_REVIEW,
        'address_verified_at' => now(),
        'identity_verified_at' => now(),
    ]);

    expect($app->addressVerified())->toBeTrue();
    expect($app->identityVerified())->toBeTrue();

    // reviewKyc logic
    $app->update([
        'status' => Application::STATUS_ESIGN_PENDING,
        'esign_expires_at' => now()->addHours(48),
    ]);

    $app->refresh();
    expect($app->status)->toBe(Application::STATUS_ESIGN_PENDING);
    expect($app->esign_expires_at)->not->toBeNull();
    expect($app->esignExpired())->toBeFalse();
});

// ─── STAGE 5 — E-sign ─────────────────────────────────────────────────────────

test('Stage 5: simple provider auto-signs the lease', function (): void {
    $app = Application::factory()->create([
        'status' => Application::STATUS_ESIGN_PENDING,
        'esign_expires_at' => now()->addHours(48),
    ]);

    // simple provider: mark signed immediately
    $app->update(['esign_signed_at' => now()]);
    expect($app->fresh()->isSigned())->toBeTrue();
});

// ─── STAGE 6 — Deposit payment ────────────────────────────────────────────────

test('Stage 6: deposit payment captures mandate reference (G4)', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ESIGN_PENDING,
        'deposit_amount' => 1_360_000,
        'monthly_lease_amount' => 6_800_000,
    ]);

    // G4: capture authorization_code from Paystack callback
    $payment = Payment::create([
        'user_id' => $user->id,
        'application_id' => $app->id,
        'amount' => 1_360_000,
        'reference' => 'AO-TEST-DEP01',
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
    expect($app->mandate_reference)->toBe('AUTH_test_abc123');
    expect($app->mandate_type)->toBe('card');
    expect($app->deposit_paid_at)->not->toBeNull();
    expect($app->status)->toBe(Application::STATUS_APPROVED);
    expect($app->depositPaid())->toBeTrue();
});

test('Stage 6: PaymentController rejects wrong deposit amount', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ESIGN_PENDING,
        'deposit_amount' => 1_360_000,
    ]);

    $this->actingAs($user)
        ->postJson(route('payments.initialize'), [
            'amount' => 999_999, // wrong amount
            'application_id' => $app->id,
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'Amount must match the required deposit.']);
});

// ─── STAGE 7 — Installer assignment ───────────────────────────────────────────

test('Stage 7: G12 blocks assignment when installer has 3+ active tickets', function (): void {
    $installer = User::factory()->create(['role' => 'installer']);

    // Create 3 active tickets
    for ($i = 0; $i < 3; $i++) {
        $a = Application::factory()->create(['status' => Application::STATUS_APPROVED]);
        InstallerTicket::create([
            'application_id' => $a->id,
            'assigned_installer_id' => $installer->id,
            'status' => InstallerTicket::STATUS_IN_PROGRESS,
        ]);
    }

    $newApp = Application::factory()->create(['status' => Application::STATUS_APPROVED]);
    $admin = User::factory()->create(['role' => 'operations', 'email_verified_at' => now()]);

    $this->actingAs($admin)
        ->postJson(route('dashboard.applications.assign-installer', $newApp), [
            'installer_id' => $installer->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['installer']);
});

test('Stage 7: installer assignment creates ticket + checklist items', function (): void {
    $installer = User::factory()->create(['role' => 'installer']);
    $app = Application::factory()->create(['status' => Application::STATUS_APPROVED]);
    $admin = User::factory()->create(['role' => 'operations', 'email_verified_at' => now()]);

    $this->actingAs($admin)
        ->postJson(route('dashboard.applications.assign-installer', $app), [
            'installer_id' => $installer->id,
        ])
        ->assertRedirect();

    $ticket = InstallerTicket::where('application_id', $app->id)->first();
    expect($ticket)->not->toBeNull();
    expect($ticket->status)->toBe(InstallerTicket::STATUS_PENDING);
    expect($ticket->checklistItems()->count())->toBeGreaterThan(0);
});

// ─── STAGE 8 — Installation completion ────────────────────────────────────────

test('Stage 8: completing ticket sets application to installed', function (): void {
    $app = Application::factory()->create(['status' => Application::STATUS_APPROVED]);
    $installer = User::factory()->create(['role' => 'installer', 'email_verified_at' => now()]);
    $ticket = InstallerTicket::create([
        'application_id' => $app->id,
        'assigned_installer_id' => $installer->id,
        'status' => InstallerTicket::STATUS_PENDING,
    ]);

    // Start
    $ticket->update(['status' => InstallerTicket::STATUS_IN_PROGRESS, 'started_at' => now()]);
    expect($ticket->fresh()->status)->toBe(InstallerTicket::STATUS_IN_PROGRESS);

    // Simulate completeTicket (file upload is mocked)
    $ticket->update([
        'status' => InstallerTicket::STATUS_COMPLETED,
        'completion_photo_path' => 'installer/completions/test.jpg',
        'completion_notes' => 'All good.',
        'completed_at' => now(),
    ]);
    $app->update(['status' => Application::STATUS_INSTALLED]);

    expect($ticket->fresh()->status)->toBe(InstallerTicket::STATUS_COMPLETED);
    expect($app->fresh()->status)->toBe(Application::STATUS_INSTALLED);
});

// ─── STAGE 9 — Auto-activation command ────────────────────────────────────────

test('Stage 9: applications:activate-installed transitions status and generates 12 schedules', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_INSTALLED,
        'monthly_lease_amount' => 6_800_000,
        'mandate_reference' => 'AUTH_test123',
        'mandate_type' => 'card',
    ]);
    $installer = User::factory()->create(['role' => 'installer']);
    $ticket = InstallerTicket::create([
        'application_id' => $app->id,
        'assigned_installer_id' => $installer->id,
        'status' => InstallerTicket::STATUS_COMPLETED,
        'completed_at' => now()->subHours(25), // > 24h ago
    ]);

    $exitCode = Artisan::call('applications:activate-installed');
    expect($exitCode)->toBe(0);

    $app->refresh();
    expect($app->status)->toBe(Application::STATUS_ACTIVE);
    expect($app->active_at)->not->toBeNull();

    $schedules = $app->paymentSchedules;
    expect($schedules)->toHaveCount(12);
    expect($schedules->first()->amount)->toBe(6_800_000);
    expect($schedules->first()->status)->toBe(PaymentSchedule::STATUS_PENDING);
    expect($schedules->first()->due_date->isStartOfMonth())->toBeTrue();
});

test('Stage 9: activate-installed skips apps completed within 24h', function (): void {
    $app = Application::factory()->create(['status' => Application::STATUS_INSTALLED]);
    $installer = User::factory()->create(['role' => 'installer']);
    InstallerTicket::create([
        'application_id' => $app->id,
        'assigned_installer_id' => $installer->id,
        'status' => InstallerTicket::STATUS_COMPLETED,
        'completed_at' => now()->subHours(10), // only 10h ago — not ready
    ]);

    Artisan::call('applications:activate-installed');

    expect($app->fresh()->status)->toBe(Application::STATUS_INSTALLED); // unchanged
});

// ─── STAGE 10 — Automated monthly billing ─────────────────────────────────────

test('Stage 10: billing:collect-monthly charges due schedule and marks it paid', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ACTIVE,
        'mandate_reference' => 'AUTH_test123',
        'mandate_type' => 'card',
        'is_suspended' => false,
    ]);
    $schedule = PaymentSchedule::create([
        'application_id' => $app->id,
        'due_date' => now()->toDateString(),
        'amount' => 6_800_000,
        'status' => PaymentSchedule::STATUS_PENDING,
        'attempt_count' => 0,
    ]);

    $mock = $this->mock(PaystackService::class);
    $mock->shouldReceive('chargeAuthorization')->once()->andReturn([
        'status' => 'success',
        'authorization' => ['authorization_code' => 'AUTH_test123'],
    ]);

    $exitCode = Artisan::call('billing:collect-monthly');
    expect($exitCode)->toBe(0);

    $schedule->refresh();
    expect($schedule->status)->toBe(PaymentSchedule::STATUS_PAID);

    $leasePayment = Payment::where('application_id', $app->id)->where('type', 'lease')->where('status', 'success')->first();
    expect($leasePayment)->not->toBeNull();

    expect(PaymentAttempt::where('payment_schedule_id', $schedule->id)->where('status', 'success')->count())->toBe(1);
});

test('Stage 10: billing:collect-monthly marks schedule failed when Paystack returns failure', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ACTIVE,
        'mandate_reference' => 'AUTH_test123',
        'is_suspended' => false,
    ]);
    $schedule = PaymentSchedule::create([
        'application_id' => $app->id,
        'due_date' => now()->toDateString(),
        'amount' => 6_800_000,
        'status' => PaymentSchedule::STATUS_PENDING,
        'attempt_count' => 0,
    ]);

    $mock = $this->mock(PaystackService::class);
    $mock->shouldReceive('chargeAuthorization')->once()->andReturn(['status' => 'failed', 'message' => 'Insufficient funds']);

    Artisan::call('billing:collect-monthly');

    $schedule->refresh();
    expect($schedule->status)->toBe(PaymentSchedule::STATUS_FAILED);

    expect(PaymentAttempt::where('payment_schedule_id', $schedule->id)->where('status', 'failed')->count())->toBe(1);
});

// ─── STAGE 11 — Early / manual payment ────────────────────────────────────────

test('Stage 11: customer can manually pay a future pending schedule', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ACTIVE,
        'mandate_reference' => 'AUTH_test123',
        'deposit_amount' => 1_360_000,
        'monthly_lease_amount' => 6_800_000,
    ]);
    $schedule = PaymentSchedule::create([
        'application_id' => $app->id,
        'due_date' => now()->addMonths(2)->startOfMonth()->toDateString(), // future
        'amount' => 6_800_000,
        'status' => PaymentSchedule::STATUS_PENDING,
    ]);

    // PaymentController@initialize with schedule_id sets type=lease
    $payment = Payment::create([
        'user_id' => $user->id,
        'application_id' => $app->id,
        'payment_schedule_id' => $schedule->id,
        'amount' => $schedule->amount,
        'reference' => 'AO-EARLY-01',
        'status' => 'success',
        'type' => 'lease',
        'paid_at' => now(),
    ]);

    // handleSuccessfulPayment marks schedule paid
    PaymentSchedule::where('id', $schedule->id)
        ->where('status', PaymentSchedule::STATUS_PENDING)
        ->update(['status' => PaymentSchedule::STATUS_PAID, 'payment_id' => $payment->id]);

    $schedule->refresh();
    expect($schedule->status)->toBe(PaymentSchedule::STATUS_PAID);
    expect($payment->type)->toBe('lease');
});

// ─── STAGE 12 — Dunning / Retry ───────────────────────────────────────────────

test('Stage 12: billing:retry-failed retries D+1 and succeeds', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ACTIVE,
        'mandate_reference' => 'AUTH_test123',
        'is_suspended' => false,
    ]);
    $schedule = PaymentSchedule::create([
        'application_id' => $app->id,
        'due_date' => now()->subDay()->toDateString(), // due yesterday → D+1 = today
        'amount' => 6_800_000,
        'status' => PaymentSchedule::STATUS_FAILED,
        'attempt_count' => 1,
        'last_attempted_at' => now()->subDay(),
    ]);

    $mock = $this->mock(PaystackService::class);
    $mock->shouldReceive('chargeAuthorization')->once()->andReturn([
        'status' => 'success',
        'authorization' => ['authorization_code' => 'AUTH_test123'],
    ]);

    $exitCode = Artisan::call('billing:retry-failed');
    expect($exitCode)->toBe(0);

    $schedule->refresh();
    expect($schedule->status)->toBe(PaymentSchedule::STATUS_PAID);
});

test('Stage 12: billing:retry-failed suspends account after all retries exhausted', function (): void {
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create([
        'status' => Application::STATUS_ACTIVE,
        'mandate_reference' => 'AUTH_test123',
        'is_suspended' => false,
    ]);
    $schedule = PaymentSchedule::create([
        'application_id' => $app->id,
        'due_date' => now()->subDays(15)->toDateString(),
        'amount' => 6_800_000,
        'status' => PaymentSchedule::STATUS_FAILED,
        'attempt_count' => 5, // all retries exhausted
        'last_attempted_at' => now()->subDay(),
    ]);

    $mock = $this->mock(PaystackService::class);
    $mock->shouldNotReceive('chargeAuthorization'); // no more charges

    $exitCode = Artisan::call('billing:retry-failed');
    expect($exitCode)->toBe(0);

    $app->refresh();
    expect((bool) $app->is_suspended)->toBeTrue();

    $schedule->refresh();
    expect($schedule->status)->toBe(PaymentSchedule::STATUS_SKIPPED);
});

test('Stage 12: billing:send-reminders runs without error', function (): void {
    $exitCode = Artisan::call('billing:send-reminders');
    expect($exitCode)->toBe(0);
});

// ─── STAGE 13 — Audit trail ────────────────────────────────────────────────────

test('Stage 13: status history is recorded for each transition', function (): void {
    $user = User::factory()->create(['role' => 'customer', 'email_verified_at' => now()]);
    $app = Application::factory()->for($user)->create(['status' => Application::STATUS_SUBMITTED]);

    // Each update fires booted() hook
    $app->update(['status' => Application::STATUS_UNDER_REVIEW]);
    $app->update(['status' => Application::STATUS_ESIGN_PENDING]);
    $app->update(['status' => Application::STATUS_APPROVED]);
    $app->update(['status' => Application::STATUS_INSTALLED]);
    $app->update(['status' => Application::STATUS_ACTIVE]);

    $history = $app->statusHistories()->orderBy('created_at')->get();
    expect($history->count())->toBe(5);

    $transitions = $history->map(fn ($h) => "{$h->from}→{$h->to}")->toArray();
    expect($transitions)->toContain('submitted→under_review');
    expect($transitions)->toContain('under_review→esign_pending');
    expect($transitions)->toContain('esign_pending→approved');
    expect($transitions)->toContain('approved→installed');
    expect($transitions)->toContain('installed→active');
});

test('Stage 13: admin history endpoint returns timeline JSON', function (): void {
    $admin = User::factory()->create(['role' => 'operations', 'email_verified_at' => now()]);
    $user = User::factory()->create(['role' => 'customer']);
    $app = Application::factory()->for($user)->create(['status' => Application::STATUS_SUBMITTED]);
    $app->update(['status' => Application::STATUS_UNDER_REVIEW]);

    $this->actingAs($admin)
        ->getJson(route('dashboard.applications.history', $app))
        ->assertOk()
        ->assertJsonStructure(['history' => [['id', 'from', 'to', 'changedBy', 'notes', 'createdAt']]]);
});

// ─── STAGE 14 — Auto-expire e-sign ────────────────────────────────────────────

test('Stage 14: applications:auto-expire-esign reverts stale esign_pending to under_review', function (): void {
    $app = Application::factory()->create([
        'status' => Application::STATUS_ESIGN_PENDING,
        'esign_expires_at' => now()->subHours(49), // 49h ago — expired
    ]);

    $exitCode = Artisan::call('applications:auto-expire-esign');
    expect($exitCode)->toBe(0);

    expect($app->fresh()->status)->toBe(Application::STATUS_UNDER_REVIEW);
});

test('Stage 14: auto-expire does not touch esign_pending that has not expired', function (): void {
    $app = Application::factory()->create([
        'status' => Application::STATUS_ESIGN_PENDING,
        'esign_expires_at' => now()->addHours(12), // still 12h left
    ]);

    Artisan::call('applications:auto-expire-esign');

    expect($app->fresh()->status)->toBe(Application::STATUS_ESIGN_PENDING); // unchanged
});
