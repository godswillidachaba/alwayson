<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallationChecklistItem extends Model
{
    protected $fillable = [
        'installer_ticket_id',
        'label',
        'is_done',
        'sort_order',
    ];

    /** @return BelongsTo<InstallerTicket, $this> */
    public function installerTicket(): BelongsTo
    {
        return $this->belongsTo(InstallerTicket::class);
    }

    protected function casts(): array
    {
        return [
            'is_done' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return list<array{label: string, sort_order: int}> */
    public static function defaults(): array
    {
        return [
            ['label' => 'Verify customer identity', 'sort_order' => 1],
            ['label' => 'Inspect installation site', 'sort_order' => 2],
            ['label' => 'Mount inverter & battery', 'sort_order' => 3],
            ['label' => 'Connect solar panels', 'sort_order' => 4],
            ['label' => 'Wire distribution board', 'sort_order' => 5],
            ['label' => 'Test all circuits', 'sort_order' => 6],
            ['label' => 'Configure monitoring app', 'sort_order' => 7],
            ['label' => 'Customer sign-off', 'sort_order' => 8],
        ];
    }
}
