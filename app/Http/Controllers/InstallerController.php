<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\InstallationChecklistItem;
use App\Models\InstallerTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Response;

class InstallerController extends Controller
{
    public function tickets(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        $tickets = $user->installerTickets()
            ->with('application.user')
            ->latest()
            ->get()
            ->map(fn (InstallerTicket $ticket) => [
                'id' => $ticket->id,
                'customerName' => $ticket->application->user->name,
                'customerEmail' => $ticket->application->user->email,
                'plan' => $ticket->application->selected_plan,
                'status' => $ticket->status,
                'notes' => $ticket->notes,
                'createdAt' => $ticket->created_at->diffForHumans(),
            ]);

        $stats = [
            'pending' => $tickets->where('status', InstallerTicket::STATUS_PENDING)->count(),
            'inProgress' => $tickets->where('status', InstallerTicket::STATUS_IN_PROGRESS)->count(),
            'completed' => $tickets->where('status', InstallerTicket::STATUS_COMPLETED)->count(),
        ];

        if ($request->header('X-Inertia')) {
            return inertia('dashboard/installer/index', [
                'tickets' => $tickets,
                'stats' => $stats,
            ]);
        }

        return response()->json(['tickets' => $tickets]);
    }

    public function showTicket(InstallerTicket $ticket): Response
    {
        $ticket->load('application.user', 'application.appliances', 'assignedInstaller', 'checklistItems');

        return inertia('dashboard/installer/show', [
            'ticket' => [
                'id' => $ticket->id,
                'customerName' => $ticket->application->user->name,
                'customerEmail' => $ticket->application->user->email,
                'customerPhone' => $ticket->application->user->phone,
                'customerAddress' => $ticket->application->location_address
                    ? [
                        'formattedAddress' => $ticket->application->location_address,
                        'street' => $ticket->application->location_street,
                        'city' => $ticket->application->location_city,
                        'state' => $ticket->application->location_state,
                        'country' => $ticket->application->location_country,
                    ]
                    : null,
                'plan' => $ticket->application->selected_plan,
                'status' => $ticket->status,
                'notes' => $ticket->notes,
                'appliances' => $ticket->application->appliances->map(fn ($a) => [
                    'label' => $a->label,
                    'quantity' => $a->quantity,
                    'watts' => $a->watts_per_unit,
                ]),
                'createdAt' => $ticket->created_at->diffForHumans(),
                'startedAt' => $ticket->started_at?->diffForHumans(),
                'completedAt' => $ticket->completed_at?->diffForHumans(),
                'completionPhotoPath' => $ticket->completion_photo_path
                    ? Storage::url($ticket->completion_photo_path) : null,
                'completionNotes' => $ticket->completion_notes,
                'checklistItems' => $ticket->checklistItems->map(fn ($item) => [
                    'id' => $item->id,
                    'label' => $item->label,
                    'isDone' => $item->is_done,
                    'sortOrder' => $item->sort_order,
                ]),
            ],
        ]);
    }

    public function startTicket(InstallerTicket $ticket): RedirectResponse
    {
        $ticket->update([
            'status' => InstallerTicket::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Ticket started.');
    }

    public function completeTicket(Request $request, InstallerTicket $ticket): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:10240'],
            'completionNotes' => ['nullable', 'string', 'max:1000'],
        ]);

        $path = $request->file('photo')->store('installer/completions', 'public');

        $ticket->update([
            'status' => InstallerTicket::STATUS_COMPLETED,
            'completion_photo_path' => $path,
            'completion_notes' => $request->input('completionNotes'),
            'completed_at' => now(),
        ]);

        $ticket->application->update([
            'status' => Application::STATUS_INSTALLED,
        ]);

        return response()->json(['message' => 'Installation completed.']);
    }

    public function toggleChecklistItem(InstallerTicket $ticket, InstallationChecklistItem $item): RedirectResponse
    {
        abort_if($item->installer_ticket_id !== $ticket->id, 403);

        $item->update(['is_done' => ! $item->is_done]);

        return redirect()->back();
    }
}
