<?php

use App\Console\Commands\ActivateInstalledApplications;
use App\Console\Commands\AutoExpireEsignRequests;
use App\Console\Commands\CollectMonthlyBilling;
use App\Console\Commands\RetryFailedPayments;
use App\Console\Commands\SendBillingReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// G5: All scheduled tasks — run `php artisan schedule:run` via cron every minute
// Cron entry: * * * * * cd /path/to/site && php artisan schedule:run >> /dev/null 2>&1

// G1: Collect monthly lease payments — runs daily at 8am
Schedule::command(CollectMonthlyBilling::class)->dailyAt('08:00')->withoutOverlapping();

// G3: Retry failed payments per dunning schedule — runs daily at 9am
Schedule::command(RetryFailedPayments::class)->dailyAt('09:00')->withoutOverlapping();

// G3: Send billing reminders (3 days before + due day) — runs daily at 7am
Schedule::command(SendBillingReminders::class)->dailyAt('07:00')->withoutOverlapping();

// G2: Activate installed applications after 24h — runs every hour
Schedule::command(ActivateInstalledApplications::class)->hourly()->withoutOverlapping();

// G7: Expire stale e-sign requests after 48h — runs every hour
Schedule::command(AutoExpireEsignRequests::class)->hourly()->withoutOverlapping();
