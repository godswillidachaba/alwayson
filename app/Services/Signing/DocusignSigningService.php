<?php

namespace App\Services\Signing;

use App\Models\Application;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DocusignSigningService implements SigningService
{
    private string $integrationKey;

    private string $apiAccountId;

    private ?string $baseUrl;

    private ?string $accessToken;

    public function __construct()
    {
        $this->integrationKey = config('services.docusign.integration_key', '');
        $this->apiAccountId = config('services.docusign.api_account_id', '');
        $this->baseUrl = null;
        $this->accessToken = null;
    }

    public function sendForSignature(User $user, Application $application): string
    {
        if (! $this->integrationKey) {
            Log::warning('DocuSign not configured — falling back to reference-based signing');

            $reference = 'SIG-'.strtoupper(Str::random(16));
            $application->update(['esign_reference' => $reference]);

            return $reference;
        }

        $token = $this->getAccessToken();

        if (! $token) {
            throw new \RuntimeException('Failed to obtain DocuSign access token');
        }

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/v2.1/accounts/{$this->apiAccountId}/envelopes", [
                'emailSubject' => 'Please sign your AlwaysON Lease Agreement',
                'documents' => $this->buildDocuments($application),
                'recipients' => [
                    'signers' => [
                        [
                            'email' => $user->email,
                            'name' => $user->name,
                            'recipientId' => '1',
                            'routingOrder' => '1',
                        ],
                    ],
                ],
                'status' => 'sent',
            ]);

        if ($response->failed()) {
            Log::error('DocuSign create envelope failed', ['response' => $response->body()]);

            throw new \RuntimeException('Failed to create DocuSign envelope');
        }

        $envelopeId = $response->json('envelopeId');

        $application->update(['esign_reference' => $envelopeId]);

        return $envelopeId;
    }

    public function isSigned(string $reference): bool
    {
        if (! $this->integrationKey) {
            return Application::where('esign_reference', $reference)
                ->whereNotNull('esign_signed_at')
                ->exists();
        }

        $token = $this->getAccessToken();

        if (! $token) {
            return false;
        }

        $response = Http::withToken($token)
            ->get("{$this->baseUrl}/v2.1/accounts/{$this->apiAccountId}/envelopes/{$reference}");

        if ($response->failed()) {
            return false;
        }

        return $response->json('status') === 'completed';
    }

    public function getSigningUrl(string $reference): ?string
    {
        if (! $this->integrationKey || ! $reference) {
            return null;
        }

        $token = $this->getAccessToken();

        if (! $token) {
            return null;
        }

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/v2.1/accounts/{$this->apiAccountId}/envelopes/{$reference}/views/recipient", [
                'email' => '',
                'userName' => '',
                'recipientId' => '1',
                'returnUrl' => route('dashboard'),
                'authenticationMethod' => 'none',
            ]);

        if ($response->failed()) {
            return null;
        }

        return $response->json('url');
    }

    public function getProviderName(): string
    {
        return 'docusign';
    }

    private function getAccessToken(): ?string
    {
        if ($this->accessToken !== null) {
            return $this->accessToken;
        }

        $privateKey = config('services.docusign.private_key');

        if (! $privateKey) {
            return null;
        }

        $response = Http::withOptions([
            'verify' => false,
        ])->asForm()->post('https://account.docusign.com/oauth/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $privateKey,
            'scope' => 'signature impersonation',
        ]);

        if ($response->failed()) {
            Log::error('DocuSign token request failed', ['response' => $response->body()]);

            return null;
        }

        $this->accessToken = $response->json('access_token');
        $this->baseUrl = $response->json('base_url');

        return $this->accessToken;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildDocuments(Application $application): array
    {
        $planName = $application->selected_plan ?? 'Standard';
        $leaseAmount = $application->monthly_lease_amount
            ? '₦'.number_format($application->monthly_lease_amount / 100)
            : 'To be confirmed';
        $depositAmount = $application->deposit_amount
            ? '₦'.number_format($application->deposit_amount / 100)
            : 'To be confirmed';

        $date = optional($application->submitted_at)->format('d F Y') ?? '—';

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<h1>AlwaysON Solar Lease Agreement</h1>
<p><strong>Customer:</strong> {$application->user->name}</p>
<p><strong>Plan:</strong> {$planName}</p>
<p><strong>Monthly Lease:</strong> {$leaseAmount}</p>
<p><strong>Deposit:</strong> {$depositAmount}</p>
<p><strong>Date:</strong> {$date}</p>
<hr>
<p>This agreement is for the lease of the AlwaysON solar system as described in the application.</p>
<p>Terms and conditions apply as per the AlwaysON lease schedule.</p>
</body>
</html>
HTML;

        return [
            [
                'documentBase64' => base64_encode($html),
                'name' => 'Lease Agreement',
                'fileExtension' => 'html',
                'documentId' => '1',
            ],
        ];
    }
}
