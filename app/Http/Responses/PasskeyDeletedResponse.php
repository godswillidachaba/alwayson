<?php

namespace App\Http\Responses;

use Laravel\Passkeys\Contracts\PasskeyDeletedResponse as PasskeyDeletedResponseContract;
use Symfony\Component\HttpFoundation\Response;

class PasskeyDeletedResponse implements PasskeyDeletedResponseContract
{
    public function toResponse($request): Response
    {
        if ($request->header('X-Inertia')) {
            return back()->with('status', 'passkey-deleted');
        }

        if ($request->wantsJson()) {
            return response()->json(['status' => 'passkey-deleted'], 200);
        }

        return back()->with('status', 'passkey-deleted');
    }
}
