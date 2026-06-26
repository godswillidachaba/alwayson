<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationAppliance extends Model
{
    protected $fillable = [
        'application_id',
        'appliance_key',
        'label',
        'watts_per_unit',
        'quantity',
    ];

    /** @return BelongsTo<Application, $this> */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
