<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Models\PaymentSchedule;
use Illuminate\Console\Command;

/**
 * G2: Move applications from 'installed' to 'active' 24 hours after completion.
 * Also creates the initial 12-month payment schedule for the lease.
 */
class ActivateInstalledApplications extends Command
{
    protected $signature = 'applications:activate-installed';

    protected $description = 'Move installed applications to active status after 24h and generate billing schedule';

    public function handle(): int
    {
        $cutoff = now()->subHours(24);

        $applications = Application::where('status', Application::STATUS_INSTALLED)
            ->whereHas('installerTicket', fn ($q) => $q->where('completed_at', '<=', $cutoff))
            ->get();

        $count = 0;

        foreach ($applications as $application) {
            // Transition to active
            $application->update([
                'status' => Application::STATUS_ACTIVE,
                'active_at' => now(),
            ]);

            // G1: Generate 12 monthly payment schedules starting next month
            if ($application->monthly_lease_amount && $application->mandate_reference) {
                $this->generatePaymentSchedules($application);
            }

            $count++;

            $this->info("Activated application #{$application->id} for user {$application->user_id}");
        }

        $this->info("Activated {$count} application(s).");

        return self::SUCCESS;
    }

    private function generatePaymentSchedules(Application $application): void
    {
        // Check if schedules already exist
        if ($application->paymentSchedules()->exists()) {
            return;
        }

        $dueDate = now()->addMonth()->startOfMonth();

        for ($i = 0; $i < 12; $i++) {
            PaymentSchedule::create([
                'application_id' => $application->id,
                'due_date' => $dueDate->copy(),
                'amount' => $application->monthly_lease_amount,
                'status' => PaymentSchedule::STATUS_PENDING,
            ]);

            $dueDate->addMonth();
        }

        $this->line("  → Generated 12 payment schedules for application #{$application->id}");
    }
}
