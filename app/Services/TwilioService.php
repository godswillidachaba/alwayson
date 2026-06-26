<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioService
{
    private string $accountSid;

    private string $authToken;

    private string $from;

    public function __construct()
    {
        $this->accountSid = config('services.twilio.account_sid');
        $this->authToken = config('services.twilio.auth_token');
        $this->from = config('services.twilio.whatsapp_from');
    }

    public function sendWhatsAppCode(string $to, string $code): bool
    {
        return $this->sendWhatsApp($to, "Your AlwaysON verification code is: {$code}");
    }

    /**
     * G13: General-purpose WhatsApp message helper for notifications.
     */
    public function sendWhatsApp(string $to, string $message): bool
    {
        if (! $this->accountSid || ! $this->authToken) {
            Log::warning('Twilio not configured — would send to {to}: {message}', [
                'to' => $to,
                'message' => $message,
            ]);

            return true;
        }

        $response = Http::withBasicAuth($this->accountSid, $this->authToken)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->accountSid}/Messages.json", [
                'To' => "whatsapp:{$to}",
                'From' => $this->from,
                'Body' => $message,
            ]);

        if ($response->failed()) {
            Log::error('Twilio WhatsApp send failed', [
                'to' => $to,
                'response' => $response->body(),
            ]);

            return false;
        }

        return true;
    }
}
