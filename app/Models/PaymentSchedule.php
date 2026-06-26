<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $application_id
 * @property int|null $payment_id
 * @property Carbon $due_date
 * @property int $amount
 * @property string $status
 * @property int $attempt_count
 * @property Carbon|null $last_attempted_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PaymentSchedule extends Model
{
    protected $fillable = [
        'application_id',
        'payment_id',
        'due_date',
        'amount',
        'status',
        'attempt_count',
        'last_attempted_at',
    ];

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SKIPPED = 'skipped';

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'amount' => 'integer',
            'attempt_count' => 'integer',
            'last_attempted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Application, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /** @return BelongsTo<Payment, $this> */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /** @return HasMany<PaymentAttempt, $this> */
    public function attempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isDue(): bool
    {
        return $this->due_date->isToday() || $this->due_date->isPast();
    }
}
