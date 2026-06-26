<?php

use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\InstallerTicket;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\PaymentSchedule;
use App\Models\User;
use App\Services\PaystackService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

test('G12: installer workload check rejects assignment if installer has 3 or more active tickets', function () {
    $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    $installer = User::factory()->create(['role' => User::ROLE_INSTALLER]);

    // Create 3 active tickets for installer
    for ($i = 0; $i < 3; $i++) {
        $app = Application::create([
            'session_token' => (string) str()->uuid(),
            'status' => Application::STATUS_APPROVED,
        ]);
        InstallerTicket::create([
            'application_id' => $app->id,
            'assigned_installer_id' => $installer->id,
            'status' => InstallerTicket::STATUS_IN_PROGRESS,
        ]);
    }

    // Attempt to assign 4th ticket
    $targetApp = Application::create([
        'session_token' => (string) str()->uuid(),
        'status' => Application::STATUS_APPROVED,
    ]);

    $this->actingAs($admin);
    $response = $this->postJson(route('dashboard.applications.assign-installer', $targetApp), [
        'installer_id' => $installer->id,
    ]);

    $response->assertStatus(422);
    expect($response->json('errors.installer'))->not->toBeEmpty();
});

test('G9: KYC BVN and Document uploads are blocked unless phone and email are verified', function () {
    $user = User::factory()->create([
        'role' => User::ROLE_CUSTOMER,
        'email_verified_at' => null,
        'phone_verified_at' => null,
    ]);

    $app = Application::create([
        'user_id' => $user->id,
        'session_token' => (string) str()->uuid(),
        'status' => Application::STATUS_SUBMITTED,
    ]);

    $this->actingAs($user);

    // Try BVN upload
    $responseBvn = $this->postJson(route('dashboard.kyc.bvn'), [
        'bvn' => '12345678901',
    ]);
    $responseBvn->assertStatus(422);

    // Try Address upload
    $responseAddress = $this->postJson(route('dashboard.kyc.address'), [
        'document' => UploadedFile::fake()->create('bill.pdf', 100),
    ]);
    $responseAddress->assertStatus(422);
});

test('G6: KYC review requires verified address and identity', function () {
    $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

    $app = Application::create([
        'user_id' => $customer->id,
        'session_token' => (string) str()->uuid(),
        'status' => Application::STATUS_UNDER_REVIEW,
    ]);

    $this->actingAs($admin);

    // Both address and identity verification dates are null -> should fail
    $response = $this->postJson(route('dashboard.applications.review-kyc', $app));
    $response->assertStatus(422);
    expect($response->json('errors.kyc'))->not->toBeEmpty();

    // Mark as verified
    $app->update([
        'address_verified_at' => now(),
        'identity_verified_at' => now(),
    ]);

    $response2 = $this->postJson(route('dashboard.applications.review-kyc', $app));
    $response2->assertRedirect();

    expect($app->fresh()->status)->toBe(Application::STATUS_ESIGN_PENDING)
        ->and($app->fresh()->esign_expires_at)->not->toBeNull();
});

test('G20: application status changes automatically write to status history trail', function () {
    $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER]);

    $app = Application::create([
        'user_id' => $customer->id,
        'session_token' => (string) str()->uuid(),
        'status' => Application::STATUS_SUBMITTED,
    ]);

    $app->update(['status' => Application::STATUS_UNDER_REVIEW]);

    $history = ApplicationStatusHistory::where('application_id', $app->id)->first();

    expect($history)->not->toBeNull()
        ->and($history->from)->toBe(Application::STATUS_SUBMITTED)
        ->and($history->to)->toBe(Application::STATUS_UNDER_REVIEW);
});

test('G1 & G3: monthly billing collection runs successfully and dunns correctly on failures', function () {
    Notification::fake();

    $customer = User::factory()->create(['role' => User::ROLE_CUSTOMER, 'phone' => '+2348000000000']);
    $app = Application::create([
        'user_id' => $customer->id,
        'session_token' => (string) str()->uuid(),
        'status' => Application::STATUS_ACTIVE,
        'mandate_reference' => 'AUTH_12345',
        'monthly_lease_amount' => 3500000, // ₦35,000 in kobo
    ]);

    // Create schedule due today
    $schedule = PaymentSchedule::create([
        'application_id' => $app->id,
        'due_date' => now()->toDateString(),
        'amount' => 3500000,
        'status' => PaymentSchedule::STATUS_PENDING,
        'attempt_count' => 0,
    ]);

    // Setup sequence mock for PaystackService: 1st is success, subsequent are failures (null)
    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('chargeAuthorization')
            ->andReturn(
                [
                    'status' => 'success',
                    'authorization' => ['authorization_code' => 'AUTH_12345'],
                ],
                null,
                null,
                null
            );
    });

    // 1. Test success scenario
    Artisan::call('billing:collect-monthly');

    expect($schedule->fresh()->status)->toBe(PaymentSchedule::STATUS_PAID)
        ->and(Payment::where('payment_schedule_id', $schedule->id)->count())->toBe(1)
        ->and(PaymentAttempt::where('payment_schedule_id', $schedule->id)->count())->toBe(1);

    // 2. Test fail scenario & dunning suspension
    $schedule->refresh();
    $schedule->update([
        'status' => PaymentSchedule::STATUS_PENDING,
        'attempt_count' => 0,
        'payment_id' => null,
    ]);

    Artisan::call('billing:collect-monthly');

    expect($schedule->fresh()->status)->toBe(PaymentSchedule::STATUS_FAILED)
        ->and($schedule->fresh()->attempt_count)->toBe(1);

    // Retry dunning checks (D+1, D+3, D+7, D+14)
    // Attempt 2: D+1 retry
    $schedule->update([
        'due_date' => now()->subDay()->toDateString(), // D+1
        'attempt_count' => 1,
    ]);

    Artisan::call('billing:retry-failed');

    expect($schedule->fresh()->attempt_count)->toBe(2);

    // All retries exhausted dunning suspension
    $schedule->update([
        'attempt_count' => 5, // retry offset checks exceed array size
    ]);

    Artisan::call('billing:retry-failed');

    expect($app->fresh()->is_suspended)->toBeTrue()
        ->and($schedule->fresh()->status)->toBe(PaymentSchedule::STATUS_SKIPPED);
});
