<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\PaymentSchedule;
use App\Notifications\AppNotification;
use App\Services\PaystackService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * G1: Daily command that charges all active customers due for their monthly lease payment.
 * Uses the Paystack authorization code (mandate) stored from the deposit payment.
 */
class CollectMonthlyBilling extends Command
{
    protected $signature = 'billing:collect-monthly';

    protected $description = 'Charge active customers for their monthly lease payment';

    // Constructor removed to prevent container caching of dependency in console boot

    public function handle(): int
    {
        $dueTodayOrOverdue = PaymentSchedule::with('application.user')
            ->where('status', PaymentSchedule::STATUS_PENDING)
            ->whereDate('due_date', '<=', now()->toDateString())
            ->where('attempt_count', 0) // Not yet tried (retries handled by billing:retry-failed)
            ->whereHas('application', fn ($q) => $q
                ->where('status', Application::STATUS_ACTIVE)
                ->whereNotNull('mandate_reference')
                ->where('is_suspended', false)
            )
            ->get();

        $this->info("Found {$dueTodayOrOverdue->count()} schedule(s) due for collection.");

        foreach ($dueTodayOrOverdue as $schedule) {
            $this->collectForSchedule($schedule);
        }

        return self::SUCCESS;
    }

    private function collectForSchedule(PaymentSchedule $schedule): void
    {
        $application = $schedule->application;
        $user = $application->user;

        if (! $user || ! $application->mandate_reference) {
            $this->warn("Skipping schedule #{$schedule->id} — no mandate reference.");

            return;
        }

        $reference = 'AO-LEASE-'.strtoupper(Str::random(10));

        // Create a pending payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'application_id' => $application->id,
            'payment_schedule_id' => $schedule->id,
            'amount' => $schedule->amount,
            'reference' => $reference,
            'status' => 'pending',
            'type' => 'lease',
        ]);

        $result = app(PaystackService::class)->chargeAuthorization(
            email: $user->email,
            amountKobo: $schedule->amount,
            authorizationCode: $application->mandate_reference,
            reference: $reference,
            metadata: [
                'user_id' => $user->id,
                'application_id' => $application->id,
                'schedule_id' => $schedule->id,
                'type' => 'lease',
            ],
        );

        $schedule->increment('attempt_count');
        $schedule->update(['last_attempted_at' => now()]);

        if ($result && ($result['status'] ?? '') === 'success') {
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'authorization_code' => $result['authorization']['authorization_code'] ?? null,
            ]);

            $schedule->update([
                'status' => PaymentSchedule::STATUS_PAID,
                'payment_id' => $payment->id,
            ]);

            PaymentAttempt::create([
                'payment_schedule_id' => $schedule->id,
                'payment_id' => $payment->id,
                'amount' => $schedule->amount,
                'status' => PaymentAttempt::STATUS_SUCCESS,
                'attempt_number' => $schedule->attempt_count,
                'ref_transaction' => $reference,
            ]);

            $amountFormatted = number_format($schedule->amount / 100);
            $user->notify(new AppNotification(
                subject: 'Lease Payment Successful',
                body: "Thank you! Your monthly lease payment of ₦{$amountFormatted} has been successfully processed.",
                level: 'success',
                actionText: 'View Payments',
                actionUrl: route('dashboard.customer.payments'),
            ));

            $this->info('✓ Collected ₦'.number_format($schedule->amount / 100)." from application #{$application->id}");
        } else {
            $payment->update(['status' => 'failed']);

            $schedule->update(['status' => PaymentSchedule::STATUS_FAILED]);

            PaymentAttempt::create([
                'payment_schedule_id' => $schedule->id,
                'payment_id' => $payment->id,
                'amount' => $schedule->amount,
                'status' => PaymentAttempt::STATUS_FAILED,
                'error_message' => $result ? json_encode($result) : 'No response from Paystack',
                'attempt_number' => $schedule->attempt_count,
                'ref_transaction' => $reference,
            ]);

            $amountFormatted = number_format($schedule->amount / 100);
            $user->notify(new AppNotification(
                subject: 'Lease Payment Failed',
                body: "We were unable to process your lease payment of ₦{$amountFormatted}. We will retry automatically according to our retry schedule.",
                level: 'error',
                actionText: 'View Payments',
                actionUrl: route('dashboard.customer.payments'),
            ));

            $this->error("✗ Failed to collect from application #{$application->id}");
        }
    }
}
