<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DojahService
{
    private string $appId;

    private string $apiKey;

    private string $baseUrl;

    public function __construct()
    {
        $this->appId = config('services.dojah.app_id') ?? '';
        $this->apiKey = config('services.dojah.api_key') ?? '';
        $this->baseUrl = config('services.dojah.base_url') ?? 'https://api.dojah.io';
    }

    /** @return array<string, mixed>|null */
    public function lookupBvn(string $bvn, ?string $firstName = null, ?string $lastName = null): ?array
    {
        if (! $this->isConfigured()) {
            Log::warning('Dojah not configured — would lookup BVN {bvn}', ['bvn' => $bvn]);

            return null;
        }

        $query = array_filter([
            'bvn' => $bvn,
            'first_name' => $firstName,
            'last_name' => $lastName,
        ]);

        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v1/kyc/bvn/full", $query);

        if ($response->failed()) {
            Log::error('Dojah BVN lookup failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json();
    }

    /** @return array<string, mixed>|null */
    public function lookupNin(string $nin): ?array
    {
        if (! $this->isConfigured()) {
            Log::warning('Dojah not configured — would lookup NIN {nin}', ['nin' => $nin]);

            return null;
        }

        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/api/v1/kyc/nin", ['nin' => $nin]);

        if ($response->failed()) {
            Log::error('Dojah NIN lookup failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json();
    }

    /** @return array<string, mixed>|null */
    public function verifyBvnWithSelfie(string $bvn, string $selfieBase64): ?array
    {
        if (! $this->isConfigured()) {
            Log::warning('Dojah not configured — would verify BVN selfie');

            return null;
        }

        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/api/v1/kyc/bvn/verify", [
                'bvn' => $bvn,
                'selfie_image' => $selfieBase64,
            ]);

        if ($response->failed()) {
            Log::error('Dojah BVN selfie verification failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json();
    }

    private function isConfigured(): bool
    {
        return $this->appId !== '' && $this->apiKey !== '';
    }

    /** @return array<string, string> */
    private function headers(): array
    {
        return [
            'AppId' => $this->appId,
            'Authorization' => $this->apiKey,
        ];
    }
}
