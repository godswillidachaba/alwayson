<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContent extends Model
{
    protected $fillable = ['section', 'content'];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    /** @return array<string, mixed>|null */
    public static function forSection(string $section): ?array
    {
        return static::where('section', $section)->value('content');
    }
}
