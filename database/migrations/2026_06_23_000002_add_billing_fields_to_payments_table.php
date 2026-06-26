<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('type', 20)->default('deposit')->after('status'); // G1: deposit or lease
            $table->string('authorization_code')->nullable()->after('type'); // G4: for recurring charges
            $table->foreignId('payment_schedule_id')->nullable()->after('application_id') // G1: link to schedule
                ->constrained('payment_schedules')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_schedule_id');
            $table->dropColumn(['type', 'authorization_code']);
        });
    }
};
