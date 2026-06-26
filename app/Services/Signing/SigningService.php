<?php

namespace App\Services\Signing;

use App\Models\Application;
use App\Models\User;

interface SigningService
{
    public function sendForSignature(User $user, Application $application): string;

    public function isSigned(string $reference): bool;

    public function getSigningUrl(string $reference): ?string;

    public function getProviderName(): string;
}
