<?php

namespace App\Http\Controllers;

use App\Services\TwilioService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class VerificationController extends Controller
{
    public function sendPhoneCode(Request $request, TwilioService $twilio): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+?[1-9]\d{1,14}$/'],
        ]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $sent = $twilio->sendWhatsAppCode($request->input('phone'), $code);

        if (! $sent) {
            return redirect()->back()->with('error', 'Failed to send verification code.');
        }

        $user->update([
            'phone' => $request->input('phone'),
            'whatsapp_code' => $code,
        ]);

        return redirect()->back()->with('success', 'Verification code sent.');
    }

    public function confirmPhoneCode(Request $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        if ($user->whatsapp_code !== $request->input('code')) {
            throw ValidationException::withMessages(['code' => 'Invalid verification code.']);
        }

        $user->update([
            'phone_verified_at' => now(),
            'whatsapp_code' => null,
        ]);

        return redirect()->back()->with('success', 'Phone verified successfully.');
    }
}
