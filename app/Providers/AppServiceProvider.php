<?php

namespace App\Providers;

use App\Http\Responses\PasskeyDeletedResponse;
use App\Services\DojahService;
use App\Services\Signing\DocusignSigningService;
use App\Services\Signing\SigningService;
use App\Services\Signing\SimpleSigningService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Passkeys\Contracts\PasskeyDeletedResponse as PasskeyDeletedResponseContract;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->usePublicPath(base_path('public_html'));

        $this->app->singleton(SigningService::class, function (): SigningService {
            $provider = config('services.signing.provider', 'simple');

            return match ($provider) {
                'docusign' => new DocusignSigningService,
                default => new SimpleSigningService,
            };
        });

        $this->app->singleton(DojahService::class, function (): DojahService {
            return new DojahService;
        });

        $this->app->singleton(PasskeyDeletedResponseContract::class, PasskeyDeletedResponse::class);
    }

    public function boot(): void
    {
        $this->configureDefaults();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
            : null,
        );
    }
}
