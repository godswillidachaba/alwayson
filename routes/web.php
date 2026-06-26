<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InstallerController;
use App\Http\Controllers\KycController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\WelcomePageController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomePageController::class, 'index'])->name('home');
Route::get('robots.txt', fn () => response()->view('robots', [
    'appUrl' => config('app.url'),
])->header('Content-Type', 'text/plain'));

Route::get('about', [PageController::class, 'about'])->name('about');
Route::get('privacy', [PageController::class, 'privacy'])->name('privacy');
Route::get('terms', [PageController::class, 'terms'])->name('terms');

Route::get('apply', [ApplicationController::class, 'create'])->name('apply');
Route::post('apply/submit', [ApplicationController::class, 'submit'])->middleware('throttle:10,1')->name('apply.submit');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('dashboard')->middleware('role:customer')->group(function () {
        Route::get('application', [DashboardController::class, 'showApplication'])->name('dashboard.application');
        Route::get('verification', [DashboardController::class, 'showVerification'])->name('dashboard.verification');
        Route::get('my-payments', [DashboardController::class, 'showPayments'])->name('dashboard.customer.payments');
        Route::post('esign/accept', [DashboardController::class, 'acceptEsign'])->name('dashboard.esign.accept');

        Route::prefix('kyc')->group(function () {
            Route::post('address', [KycController::class, 'submitAddress'])->name('dashboard.kyc.address');
            Route::post('identity/bvn', [KycController::class, 'submitBvn'])->name('dashboard.kyc.bvn');
            Route::post('identity/document', [KycController::class, 'submitIdentityDocument'])->name('dashboard.kyc.identity-document');
            Route::get('status', [KycController::class, 'status'])->name('dashboard.kyc.status');
        });
    });

    Route::prefix('dashboard')->middleware('role:super_admin,operations')->group(function () {
        Route::get('applications', [AdminController::class, 'applications'])->name('dashboard.applications');
        Route::put('applications/{application}', [AdminController::class, 'updateApplication'])->name('dashboard.applications.update');
        Route::delete('applications/{application}', [AdminController::class, 'destroyApplication'])->name('dashboard.applications.destroy');
        Route::post('applications/{application}/review-kyc', [AdminController::class, 'reviewKyc'])->name('dashboard.applications.review-kyc');
        Route::post('applications/{application}/decline-kyc', [AdminController::class, 'declineKyc'])->name('dashboard.applications.decline-kyc');
        Route::post('applications/{application}/assign-installer', [AdminController::class, 'assignInstaller'])->name('dashboard.applications.assign-installer');
        // G20: Status audit trail
        Route::get('applications/{application}/history', [AdminController::class, 'getApplicationHistory'])->name('dashboard.applications.history');
    });

    Route::prefix('dashboard')->middleware('role:super_admin')->group(function () {
        Route::get('payments', [AdminController::class, 'payments'])->name('dashboard.payments.list');
        Route::put('payments/{payment}', [AdminController::class, 'updatePayment'])->name('dashboard.payments.update');
        Route::delete('payments/{payment}', [AdminController::class, 'destroyPayment'])->name('dashboard.payments.destroy');
        Route::get('users', [AdminController::class, 'users'])->name('dashboard.users');
        Route::post('users', [AdminController::class, 'storeUser'])->name('dashboard.users.store');
        Route::put('users/{user}', [AdminController::class, 'updateUser'])->name('dashboard.users.update');
        Route::delete('users/{user}', [AdminController::class, 'destroyUser'])->name('dashboard.users.destroy');
        Route::get('site', [AdminController::class, 'site'])->name('dashboard.site');
        Route::put('site', [AdminController::class, 'updateSite'])->name('dashboard.site.update');
    });

    Route::prefix('dashboard')->middleware('role:installer')->group(function () {
        Route::get('installer/tickets', [InstallerController::class, 'tickets'])->name('dashboard.installer.tickets');
        Route::get('installer/tickets/{ticket}', [InstallerController::class, 'showTicket'])->name('dashboard.installer.ticket.show');
        Route::post('installer/tickets/{ticket}/start', [InstallerController::class, 'startTicket'])->name('dashboard.installer.ticket.start');
        Route::post('installer/tickets/{ticket}/complete', [InstallerController::class, 'completeTicket'])->name('dashboard.installer.ticket.complete');
        Route::post('installer/tickets/{ticket}/checklist/{item}/toggle', [InstallerController::class, 'toggleChecklistItem'])->name('dashboard.installer.ticket.checklist.toggle');
    });

    Route::prefix('verify')->group(function () {
        Route::post('phone/send', [VerificationController::class, 'sendPhoneCode'])->name('verify.phone.send');
        Route::post('phone/confirm', [VerificationController::class, 'confirmPhoneCode'])->name('verify.phone.confirm');
    });

    Route::prefix('payments')->group(function () {
        Route::post('initialize', [PaymentController::class, 'initialize'])->name('payments.initialize');
        Route::get('callback', [PaymentController::class, 'callback'])->name('payments.callback');
    });
});

Route::post('payments/webhook', [PaymentController::class, 'webhook'])->name('payments.webhook')
    ->withoutMiddleware([VerifyCsrfToken::class]);

Route::post('esign/webhook', function () {
    return response()->json(['status' => true]);
})->name('esign.webhook')->withoutMiddleware([VerifyCsrfToken::class]);

require __DIR__.'/settings.php';
