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
 * G3: Retry failed lease payments using the dunning schedule:
 *   Attempt 1: Day 0 (handled by billing:collect-monthly)
 *   Attempt 2: D+1
 *   Attempt 3: D+3
 *   Attempt 4: D+7
 *   Attempt 5: D+14 — if still failed, suspend account
 */
class RetryFailedPayments extends Command
{
    protected $signature = 'billing:retry-failed';

    protected $description = 'Retry failed lease payments using a dunning schedule';

    /** Days after original due date to retry */
    private const RETRY_DAYS = [1, 3, 7, 14];

    // Constructor removed to prevent container caching of dependency in console boot

    public function handle(): int
    {
        $failedSchedules = PaymentSchedule::with('application.user')
            ->where('status', PaymentSchedule::STATUS_FAILED)
            ->whereHas('application', fn ($q) => $q
                ->where('status', Application::STATUS_ACTIVE)
                ->whereNotNull('mandate_reference')
                ->where('is_suspended', false)
            )
            ->get();

        $this->info("Found {$failedSchedules->count()} failed schedule(s) to evaluate.");

        foreach ($failedSchedules as $schedule) {
            $this->evaluateRetry($schedule);
        }

        return self::SUCCESS;
    }

    private function evaluateRetry(PaymentSchedule $schedule): void
    {
        $application = $schedule->application;
        $attemptNumber = $schedule->attempt_count;
        $dueDate = $schedule->due_date;

        // Check if this attempt number is within the retry plan
        if ($attemptNumber > count(self::RETRY_DAYS)) {
            // All retries exhausted — suspend account
            $this->suspendApplication($application, $schedule);

            return;
        }

        $retryOffset = self::RETRY_DAYS[$attemptNumber - 1] ?? null;

        if ($retryOffset === null) {
            return;
        }

        $retryDate = $dueDate->copy()->addDays($retryOffset);

        if (! $retryDate->isToday()) {
            return; // Not time to retry yet
        }

        $user = $application->user;
        $reference = 'AO-RETRY-'.strtoupper(Str::random(10));

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
                'type' => 'lease_retry',
                'attempt_number' => $attemptNumber + 1,
            ],
        );

        $schedule->increment('attempt_count');
        $schedule->update(['last_attempted_at' => now()]);

        if ($result && ($result['status'] ?? '') === 'success') {
            $payment->update([
                'status' => 'success',
                'paid_at' => now(),
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
                body: "Thank you! Your retry lease payment of ₦{$amountFormatted} has been successfully processed, restoring/keeping your status active.",
                level: 'success',
                actionText: 'View Payments',
                actionUrl: route('dashboard.customer.payments'),
            ));

            $this->info("✓ Retry succeeded for application #{$application->id}");
        } else {
            $payment->update(['status' => 'failed']);

            PaymentAttempt::create([
                'payment_schedule_id' => $schedule->id,
                'payment_id' => $payment->id,
                'amount' => $schedule->amount,
                'status' => PaymentAttempt::STATUS_FAILED,
                'error_message' => $result ? json_encode($result) : 'No response',
                'attempt_number' => $schedule->attempt_count,
                'ref_transaction' => $reference,
            ]);

            $this->error("✗ Retry #{$schedule->attempt_count} failed for application #{$application->id}");
        }
    }

    private function suspendApplication(Application $application, PaymentSchedule $schedule): void
    {
        $application->update(['is_suspended' => true]);

        $schedule->update(['status' => PaymentSchedule::STATUS_SKIPPED]);

        // G13: Notify customer their account has been suspended
        $application->user?->notify(new AppNotification(
            subject: 'Account Suspended — Action Required',
            body: 'Your AlwaysON service has been suspended due to consecutive failed lease payments. Please log in to make a payment and restore service.',
            level: 'error',
            actionText: 'Pay Now',
            actionUrl: route('dashboard.customer.payments'),
        ));

        $this->warn("⚠ Suspended application #{$application->id} after all retries exhausted.");
    }
}
