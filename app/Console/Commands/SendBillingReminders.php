<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Models\PaymentSchedule;
use App\Notifications\AppNotification;
use Illuminate\Console\Command;

/**
 * G3: Send payment reminder notifications 3 days before a schedule is due.
 * Also sends a reminder on the due date itself.
 */
class SendBillingReminders extends Command
{
    protected $signature = 'billing:send-reminders';

    protected $description = 'Send payment reminder notifications to customers before their due dates';

    public function handle(): int
    {
        // 3-day advance reminder
        $threeDayReminders = PaymentSchedule::with('application.user')
            ->where('status', PaymentSchedule::STATUS_PENDING)
            ->whereDate('due_date', now()->addDays(3)->toDateString())
            ->whereHas('application', fn ($q) => $q
                ->where('status', Application::STATUS_ACTIVE)
                ->where('is_suspended', false)
            )
            ->get();

        foreach ($threeDayReminders as $schedule) {
            $user = $schedule->application?->user;

            if ($user) {
                // G13: fire notification — "Your payment of ₦X is due in 3 days"
                $amountFormatted = number_format($schedule->amount / 100);
                $user->notify(new AppNotification(
                    subject: 'Upcoming Payment Reminder',
                    body: "Your lease payment of ₦{$amountFormatted} is due in 3 days on {$schedule->due_date->format('d M Y')}.",
                    level: 'info',
                    actionText: 'View Payments',
                    actionUrl: route('dashboard.customer.payments'),
                ));
                $this->info("3-day reminder queued for user #{$user->id} (schedule #{$schedule->id})");
            }
        }

        // Due-today reminder
        $todayReminders = PaymentSchedule::with('application.user')
            ->where('status', PaymentSchedule::STATUS_PENDING)
            ->whereDate('due_date', now()->toDateString())
            ->whereHas('application', fn ($q) => $q
                ->where('status', Application::STATUS_ACTIVE)
                ->where('is_suspended', false)
            )
            ->get();

        foreach ($todayReminders as $schedule) {
            $user = $schedule->application?->user;

            if ($user) {
                // G13: fire notification — "Your payment of ₦X is due TODAY"
                $amountFormatted = number_format($schedule->amount / 100);
                $user->notify(new AppNotification(
                    subject: 'Lease Payment Due Today',
                    body: "Your monthly lease payment of ₦{$amountFormatted} is due today. We will attempt to charge your saved payment method automatically.",
                    level: 'warning',
                    actionText: 'View Payments',
                    actionUrl: route('dashboard.customer.payments'),
                ));
                $this->info("Due-today reminder queued for user #{$user->id} (schedule #{$schedule->id})");
            }
        }

        $total = $threeDayReminders->count() + $todayReminders->count();
        $this->info("Sent {$total} reminder(s).");

        return self::SUCCESS;
    }
}
