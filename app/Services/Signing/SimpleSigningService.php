<?php

namespace App\Services\Signing;

use App\Models\Application;
use App\Models\User;
use Illuminate\Support\Str;

class SimpleSigningService implements SigningService
{
    public function sendForSignature(User $user, Application $application): string
    {
        $reference = 'SIG-'.strtoupper(Str::random(16));

        $application->update(['esign_reference' => $reference]);

        return $reference;
    }

    public function isSigned(string $reference): bool
    {
        return Application::where('esign_reference', $reference)
            ->whereNotNull('esign_signed_at')
            ->exists();
    }

    public function getSigningUrl(string $reference): ?string
    {
        return null;
    }

    public function getProviderName(): string
    {
        return 'simple';
    }
}
