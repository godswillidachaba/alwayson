<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $application_id
 * @property int|null $assigned_installer_id
 * @property string $status
 * @property string|null $notes
 * @property string|null $completion_photo_path
 * @property string|null $completion_notes
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class InstallerTicket extends Model
{
    protected $fillable = [
        'application_id',
        'assigned_installer_id',
        'status',
        'notes',
        'completion_photo_path',
        'completion_notes',
        'completed_at',
    ];

    public const STATUS_PENDING = 'pending';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    /** @return BelongsTo<Application, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignedInstaller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_installer_id');
    }

    /** @return HasMany<InstallationChecklistItem, $this> */
    public function checklistItems(): HasMany
    {
        return $this->hasMany(InstallationChecklistItem::class)->orderBy('sort_order');
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
