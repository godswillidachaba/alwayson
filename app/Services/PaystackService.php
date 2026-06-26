<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackService
{
    private string $secretKey;

    public function __construct()
    {
        $this->secretKey = config('services.paystack.secret_key');
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function initializeTransaction(string $email, int $amountKobo, string $reference, array $metadata = []): ?string
    {
        if (! $this->secretKey) {
            Log::warning('Paystack not configured — skipping transaction init');

            return null;
        }

        $response = Http::withToken($this->secretKey)
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $email,
                'amount' => $amountKobo,
                'reference' => $reference,
                'metadata' => $metadata,
                'callback_url' => route('payments.callback'),
            ]);

        if ($response->failed() || ! ($response->json('status'))) {
            Log::error('Paystack init failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json('data.authorization_url');
    }

    /**
     * @return array<string, mixed>|null
     */
    public function verifyTransaction(string $reference): ?array
    {
        if (! $this->secretKey) {
            return null;
        }

        $response = Http::withToken($this->secretKey)
            ->get("https://api.paystack.co/transaction/verify/{$reference}");

        if ($response->failed()) {
            Log::error('Paystack verify failed', ['response' => $response->body()]);

            return null;
        }

        return $response->json('data');
    }

    /**
     * G1/G4: Charge a customer using a stored authorization code (recurring billing).
     * This uses the card previously authorized during the deposit payment.
     *
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>|null Transaction data on success, null on failure
     */
    public function chargeAuthorization(
        string $email,
        int $amountKobo,
        string $authorizationCode,
        string $reference,
        array $metadata = [],
    ): ?array {
        if (! $this->secretKey) {
            Log::warning('Paystack not configured — skipping charge authorization');

            return null;
        }

        $response = Http::withToken($this->secretKey)
            ->post('https://api.paystack.co/transaction/charge_authorization', [
                'email' => $email,
                'amount' => $amountKobo,
                'authorization_code' => $authorizationCode,
                'reference' => $reference,
                'metadata' => $metadata,
            ]);

        if ($response->failed() || ! ($response->json('status'))) {
            Log::error('Paystack charge_authorization failed', [
                'email' => $email,
                'reference' => $reference,
                'response' => $response->body(),
            ]);

            return null;
        }

        return $response->json('data');
    }
}
