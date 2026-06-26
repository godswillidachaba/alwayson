<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\KycDocument;
use App\Services\DojahService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KycController extends Controller
{
    public function __construct(
        private readonly DojahService $dojah,
    ) {}

    public function submitAddress(Request $request): JsonResponse
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return response()->json(['message' => 'No application found.'], 404);
        }

        // G9: Require verified email and phone before accepting KYC documents
        if (! $user->email_verified_at || ! $user->phone_verified_at) {
            return response()->json([
                'message' => 'Please verify your email and phone number before submitting KYC documents.',
            ], 422);
        }

        $request->validate([
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $path = $request->file('document')->store('kyc/address', 'public');

        KycDocument::create([
            'application_id' => $application->id,
            'type' => KycDocument::TYPE_PROOF_OF_ADDRESS,
            'file_path' => $path,
            'notes' => $request->input('notes'),
            'status' => KycDocument::STATUS_PENDING,
        ]);

        $application->update([
            'address_verified_at' => now(),
            'address_notes' => $request->input('notes'),
            'address_document_path' => $path,
        ]);

        $this->advanceIfKycComplete($application);

        return response()->json(['message' => 'Address document uploaded.']);
    }

    public function submitBvn(Request $request): JsonResponse
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return response()->json(['message' => 'No application found.'], 404);
        }

        // G9: Require verified email and phone before BVN submission
        if (! $user->email_verified_at || ! $user->phone_verified_at) {
            return response()->json([
                'message' => 'Please verify your email and phone number before submitting your BVN.',
            ], 422);
        }

        $request->validate([
            'bvn' => ['required', 'string', 'size:11'],
        ]);

        $bvn = $request->input('bvn');

        $result = $this->dojah->lookupBvn($bvn);

        if ($result === null) {
            $application->update([
                'identity_bvn' => $bvn,
                'identity_verified_at' => now(),
            ]);

            $this->advanceIfKycComplete($application);

            return response()->json([
                'message' => 'BVN recorded (verification unavailable — service not configured).',
                'verified' => false,
                'configured' => false,
            ]);
        }

        $entity = $result['entity'] ?? [];
        $nameMatch = ($entity['first_name']['status'] ?? false) && ($entity['last_name']['status'] ?? false);

        $bvnMatched = $nameMatch;

        $application->update([
            'identity_bvn' => $bvn,
            'identity_bvn_data' => $result,
            'identity_verified_at' => $bvnMatched ? now() : null,
        ]);

        if (! $bvnMatched) {
            return response()->json([
                'message' => 'BVN name mismatch. Your name does not match the BVN record.',
                'verified' => false,
                'configured' => true,
                'bvnData' => [
                    'firstNameMatch' => $entity['first_name']['status'] ?? false,
                    'lastNameMatch' => $entity['last_name']['status'] ?? false,
                    'bvnValid' => $entity['bvn']['status'] ?? false,
                ],
            ], 422);
        }

        $this->advanceIfKycComplete($application);

        return response()->json([
            'message' => 'BVN verified successfully.',
            'verified' => true,
            'configured' => true,
        ]);
    }

    public function submitIdentityDocument(Request $request): JsonResponse
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return response()->json(['message' => 'No application found.'], 404);
        }

        // G9: Require verified email and phone before accepting KYC documents
        if (! $user->email_verified_at || ! $user->phone_verified_at) {
            return response()->json([
                'message' => 'Please verify your email and phone number before submitting KYC documents.',
            ], 422);
        }

        $request->validate([
            'document' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $path = $request->file('document')->store('kyc/identity', 'public');

        KycDocument::create([
            'application_id' => $application->id,
            'type' => KycDocument::TYPE_IDENTITY_DOCUMENT,
            'file_path' => $path,
            'status' => KycDocument::STATUS_PENDING,
        ]);

        $application->update([
            'identity_document_path' => $path,
        ]);

        return response()->json(['message' => 'Identity document uploaded.']);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $application = $user->applications()->latest()->first();

        if (! $application) {
            return response()->json(['kyc' => null]);
        }

        return response()->json([
            'kyc' => [
                'addressVerified' => $application->addressVerified(),
                'identityVerified' => $application->identityVerified(),
                'bvnPrefix' => $application->identity_bvn ? substr($application->identity_bvn, 0, 4).'*******' : null,
            ],
        ]);
    }

    private function advanceIfKycComplete(Application $application): void
    {
        if ($application->kycComplete() && $application->status === Application::STATUS_SUBMITTED) {
            $application->update(['status' => Application::STATUS_UNDER_REVIEW]);
        }
    }
}
