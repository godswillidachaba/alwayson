<?php

namespace App\Console\Commands;

use App\Models\Application;
use App\Notifications\AppNotification;
use Illuminate\Console\Command;

/**
 * G7: Expire e-sign requests that have passed their 48-hour deadline.
 * Moves the application back to 'under_review' and clears the esign window.
 */
class AutoExpireEsignRequests extends Command
{
    protected $signature = 'applications:auto-expire-esign';

    protected $description = 'Expire stale e-sign requests older than 48 hours';

    public function handle(): int
    {
        $expired = Application::where('status', Application::STATUS_ESIGN_PENDING)
            ->whereNotNull('esign_expires_at')
            ->where('esign_expires_at', '<', now())
            ->whereNull('esign_signed_at') // not already signed
            ->get();

        $count = 0;

        foreach ($expired as $application) {
            $application->update([
                'status' => Application::STATUS_UNDER_REVIEW,
                'esign_expires_at' => null,
            ]);

            // G13: notify customer their e-sign link expired
            $application->user?->notify(new AppNotification(
                subject: 'E-Sign Agreement Link Expired',
                body: 'Your e-sign link has expired (48 hours window exceeded). Your application is back under review.',
                level: 'warning',
                actionText: 'View Dashboard',
                actionUrl: route('dashboard'),
            ));

            $count++;

            $this->info("Expired e-sign for application #{$application->id}");
        }

        $this->info("Expired {$count} e-sign request(s).");

        return self::SUCCESS;
    }
}
