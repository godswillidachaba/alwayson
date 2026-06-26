<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Payment;
use App\Models\PaymentSchedule;
use App\Notifications\AppNotification;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function initialize(Request $request, PaystackService $paystack): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'amount' => ['required', 'integer', 'min:100'],
            'application_id' => ['required', 'integer', 'exists:applications,id'],
            'schedule_id' => ['sometimes', 'nullable', 'integer', 'exists:payment_schedules,id'],
        ]);

        $application = Application::where('id', $request->input('application_id'))
            ->where('user_id', $user->id)
            ->firstOrFail();

        $amount = (int) $request->input('amount');
        $scheduleId = $request->input('schedule_id');
        $type = $scheduleId ? 'lease' : 'deposit';

        // For deposit payments, validate exact amount
        if ($type === 'deposit' && $application->deposit_amount && $amount !== $application->deposit_amount) {
            return response()->json(['message' => 'Amount must match the required deposit.'], 422);
        }

        // For lease payments, validate against the schedule
        if ($type === 'lease') {
            $schedule = PaymentSchedule::where('id', $scheduleId)
                ->where('application_id', $application->id)
                ->where('status', PaymentSchedule::STATUS_PENDING)
                ->firstOrFail();

            $amount = $schedule->amount;
        }

        $reference = 'AO-'.strtoupper(Str::random(12));

        Payment::create([
            'user_id' => $user->id,
            'application_id' => $application->id,
            'payment_schedule_id' => $scheduleId,
            'amount' => $amount,
            'reference' => $reference,
            'status' => 'pending',
            'type' => $type,
        ]);

        $url = $paystack->initializeTransaction(
            $user->email,
            $amount,
            $reference,
            ['user_id' => $user->id, 'application_id' => $application->id, 'type' => $type]
        );

        if (! $url) {
            return response()->json(['message' => 'Failed to initialize payment.'], 500);
        }

        return response()->json(['authorization_url' => $url]);
    }

    public function callback(Request $request, PaystackService $paystack): RedirectResponse
    {
        $reference = $request->query('reference');

        if (! $reference) {
            return to_route('dashboard');
        }

        $data = $paystack->verifyTransaction($reference);

        $payment = Payment::where('reference', $reference)->first();

        if ($data && ($data['status'] === 'success')) {
            // G4: Capture authorization code for future recurring charges
            $authCode = $data['authorization']['authorization_code'] ?? null;

            $payment?->update([
                'status' => 'success',
                'paid_at' => now(),
                'authorization_code' => $authCode,
            ]);

            if ($payment && $payment->application_id) {
                $this->handleSuccessfulPayment($payment, $authCode);
            }
        } else {
            $payment?->update([
                'status' => 'failed',
            ]);
        }

        return to_route('dashboard');
    }

    public function webhook(Request $request, PaystackService $paystack): JsonResponse
    {
        $payload = $request->all();

        if (($payload['event'] ?? '') === 'charge.success') {
            $reference = $payload['data']['reference'] ?? null;

            if ($reference) {
                $payment = Payment::where('reference', $reference)->first();
                // G4: Capture authorization code
                $authCode = $payload['data']['authorization']['authorization_code'] ?? null;

                $payment?->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'authorization_code' => $authCode,
                ]);

                if ($payment && $payment->application_id) {
                    $this->handleSuccessfulPayment($payment, $authCode);
                }
            }
        }

        return response()->json(['status' => true]);
    }

    /**
     * G4: When a payment succeeds, store authorization code on the application as mandate.
     * G1: If it's a lease payment, mark the schedule as paid.
     */
    private function handleSuccessfulPayment(Payment $payment, ?string $authCode): void
    {
        $application = Application::find($payment->application_id);

        if (! $application) {
            return;
        }

        $updates = [];

        // G4: Store mandate (authorization code) the first time we get one
        if ($authCode && ! $application->mandate_reference) {
            $updates['mandate_reference'] = $authCode;
            $updates['mandate_type'] = 'card';
        }

        // Handle deposit payment success
        if ($payment->type === 'deposit' && $application->status === Application::STATUS_ESIGN_PENDING) {
            $updates['deposit_paid_at'] = now();
            $updates['status'] = Application::STATUS_APPROVED;

            // G13: Notify customer their deposit was received and an installer will be assigned
            $application->user?->notify(new AppNotification(
                subject: 'Deposit Received — Installation Incoming!',
                body: 'Your deposit payment has been confirmed. We\'re now scheduling your installation. We\'ll be in touch shortly!',
                level: 'success',
                actionText: 'View Dashboard',
                actionUrl: route('dashboard'),
            ));
        }

        if (! empty($updates)) {
            $application->update($updates);
        }

        // G1: Mark linked payment schedule as paid
        if ($payment->payment_schedule_id) {
            PaymentSchedule::where('id', $payment->payment_schedule_id)
                ->where('status', PaymentSchedule::STATUS_PENDING)
                ->update([
                    'status' => PaymentSchedule::STATUS_PAID,
                    'payment_id' => $payment->id,
                ]);
        }
    }
}
