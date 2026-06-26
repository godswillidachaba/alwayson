<?php

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\ApplicationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $session_token
 * @property int|null $user_id
 * @property string|null $full_name
 * @property string|null $phone
 * @property string|null $email
 * @property bool $ndpr_consented
 * @property float|null $location_lat
 * @property float|null $location_lng
 * @property string|null $location_address
 * @property string|null $location_street
 * @property string|null $location_city
 * @property string|null $location_state
 * @property string|null $location_country
 * @property string|null $billing_street
 * @property string|null $billing_city
 * @property string|null $billing_state
 * @property string|null $billing_country
 * @property int $current_step
 * @property Carbon|null $submitted_at
 * @property string $status
 * @property int|null $assigned_sales_id
 * @property string|null $building_type
 * @property string|null $selected_plan
 * @property int|null $monthly_income
 * @property int|null $monthly_bill
 * @property int|null $monthly_generator
 * @property int|null $total_load_watts
 * @property string|null $decline_reason
 * @property array<string, mixed>|null $decline_details
 * @property int|null $deposit_amount
 * @property int|null $monthly_lease_amount
 * @property string|null $esign_reference
 * @property Carbon|null $esign_signed_at
 * @property Carbon|null $esign_expires_at
 * @property Carbon|null $deposit_paid_at
 * @property string|null $mandate_reference
 * @property string|null $mandate_type
 * @property Carbon|null $mandate_expires_at
 * @property Carbon|null $active_at
 * @property bool $is_suspended
 * @property Carbon|null $address_verified_at
 * @property string|null $address_notes
 * @property string|null $address_document_path
 * @property Carbon|null $identity_verified_at
 * @property string|null $identity_bvn
 * @property array<string, mixed>|null $identity_bvn_data
 * @property string|null $identity_document_path
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Application extends Model
{
    /** @use HasFactory<ApplicationFactory> */
    use HasFactory;

    protected $fillable = [
        'session_token',
        'user_id',
        'full_name',
        'phone',
        'email',
        'ndpr_consented',
        'location_lat',
        'location_lng',
        'location_address',
        'location_street',
        'location_city',
        'location_state',
        'location_country',
        'billing_street',
        'billing_city',
        'billing_state',
        'billing_country',
        'current_step',
        'submitted_at',
        'status',
        'assigned_sales_id',
        'building_type',
        'selected_plan',
        'monthly_income',
        'monthly_bill',
        'monthly_generator',
        'total_load_watts',
        'decline_reason',
        'decline_details',
        'deposit_amount',
        'monthly_lease_amount',
        'esign_reference',
        'esign_signed_at',
        'esign_expires_at',         // G7
        'deposit_paid_at',
        'mandate_reference',
        'mandate_type',             // G4
        'mandate_expires_at',       // G4
        'active_at',                // G2
        'is_suspended',             // G3
        'address_verified_at',
        'address_notes',
        'address_document_path',
        'identity_verified_at',
        'identity_bvn',
        'identity_bvn_data',
        'identity_document_path',
    ];

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_ADDRESS_VERIFICATION = 'address_verification';

    public const STATUS_IDENTITY_VERIFICATION = 'identity_verification';

    public const STATUS_UNDER_REVIEW = 'under_review';

    public const STATUS_ESIGN_PENDING = 'esign_pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_INSTALLED = 'installed';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_DECLINED = 'declined';

    public const DECLINE_INCOME = 'income_threshold';

    public const DECLINE_KYC_BVN = 'kyc_bvn_failure';

    public const DECLINE_ADDRESS = 'address_not_serviceable';

    /**
     * G20: Automatically record status changes in the audit trail.
     */
    protected static function booted(): void
    {
        static::creating(function (Application $application): void {
            if (! $application->session_token) {
                $application->session_token = (string) Str::uuid();
            }
        });

        static::updating(function (Application $application): void {
            if ($application->isDirty('status')) {
                ApplicationStatusHistory::create([
                    'application_id' => $application->id,
                    'from' => $application->getOriginal('status'),
                    'to' => $application->status,
                    'user_id' => auth()->id(),
                ]);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'current_step' => 'integer',
            'submitted_at' => 'datetime',
            'monthly_income' => 'integer',
            'monthly_bill' => 'integer',
            'monthly_generator' => 'integer',
            'total_load_watts' => 'integer',
            'decline_details' => 'array',
            'deposit_amount' => 'integer',
            'monthly_lease_amount' => 'integer',
            'esign_signed_at' => 'datetime',
            'esign_expires_at' => 'datetime',   // G7
            'deposit_paid_at' => 'datetime',
            'active_at' => 'datetime',           // G2
            'is_suspended' => 'boolean',         // G3
            'mandate_expires_at' => 'datetime',  // G4
            'address_verified_at' => 'datetime',
            'identity_verified_at' => 'datetime',
            // G19: Encrypt BVN data at rest
            'identity_bvn' => 'encrypted',
            'identity_bvn_data' => 'encrypted:array',
        ];
    }

    public function estimatedMonthlySavings(): int
    {
        return ($this->monthly_bill ?? 0) + ($this->monthly_generator ?? 0);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignedSales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_sales_id');
    }

    /** @return HasMany<ApplicationAppliance, $this> */
    public function appliances(): HasMany
    {
        return $this->hasMany(ApplicationAppliance::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasMany<KycDocument, $this> */
    public function kycDocuments(): HasMany
    {
        return $this->hasMany(KycDocument::class);
    }

    /** @return HasOne<InstallerTicket, $this> */
    public function installerTicket(): HasOne
    {
        return $this->hasOne(InstallerTicket::class);
    }

    /** @return HasMany<PaymentSchedule, $this> */
    public function paymentSchedules(): HasMany
    {
        return $this->hasMany(PaymentSchedule::class);
    }

    /** @return HasMany<ApplicationStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class);
    }

    public function totalPaid(): int
    {
        return (int) $this->payments()->where('status', 'success')->sum('amount');
    }

    public function depositPaid(): bool
    {
        return $this->deposit_paid_at !== null;
    }

    public function isSigned(): bool
    {
        return $this->esign_signed_at !== null;
    }

    public function isDeclined(): bool
    {
        return $this->status === self::STATUS_DECLINED;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function addressVerified(): bool
    {
        return $this->address_verified_at !== null;
    }

    public function identityVerified(): bool
    {
        return $this->identity_verified_at !== null;
    }

    public function kycComplete(): bool
    {
        return $this->addressVerified() && $this->identityVerified();
    }

    /** G7: Has the e-sign window expired? */
    public function esignExpired(): bool
    {
        return $this->esign_expires_at !== null && $this->esign_expires_at->isPast();
    }

    public function getDeclineMessageKey(): ?string
    {
        if (! $this->isDeclined() || ! $this->decline_reason) {
            return null;
        }

        return match ($this->decline_reason) {
            self::DECLINE_INCOME => 'income_threshold',
            self::DECLINE_KYC_BVN => 'kyc_bvn_failure',
            self::DECLINE_ADDRESS => 'address_not_serviceable',
            default => null,
        };
    }
}
