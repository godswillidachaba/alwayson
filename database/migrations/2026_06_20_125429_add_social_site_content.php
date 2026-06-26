<?php

use App\Models\SiteContent;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        SiteContent::updateOrCreate(
            ['section' => 'social'],
            [
                'content' => [
                    'links' => [
                        ['platform' => 'LinkedIn', 'url' => '', 'visible' => false],
                        ['platform' => 'Instagram', 'url' => '', 'visible' => false],
                    ],
                ],
            ],
        );
    }

    public function down(): void
    {
        SiteContent::where('section', 'social')->delete();
    }
};
