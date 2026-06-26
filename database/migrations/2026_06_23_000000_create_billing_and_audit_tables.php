<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // G19: Change to text to accommodate encrypted BVN values
        Schema::table('applications', function (Blueprint $table) {
            $table->text('identity_bvn')->nullable()->change();
            $table->text('identity_bvn_data')->nullable()->change();
        });

        // G1: Payment schedules table for monthly lease billing
        Schema::create('payment_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->date('due_date');
            $table->integer('amount'); // in kobo
            $table->string('status', 20)->default('pending'); // pending, paid, failed, skipped
            $table->unsignedTinyInteger('attempt_count')->default(0);
            $table->timestamp('last_attempted_at')->nullable();
            $table->timestamps();

            $table->index(['application_id', 'status']);
            $table->index(['status', 'due_date']);
        });

        // G3: Payment attempts table for dunning / retry tracking
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('amount'); // in kobo
            $table->string('status', 20)->default('pending'); // pending, success, failed
            $table->text('error_message')->nullable();
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->string('ref_transaction')->nullable();
            $table->timestamps();

            $table->index(['payment_schedule_id', 'status']);
        });

        // G20: Application status audit trail
        Schema::create('application_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->string('from', 30)->nullable();
            $table->string('to', 30);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('application_id');
        });

        // Laravel's built-in notifications table (database channel)
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('application_status_histories');
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('payment_schedules');

        Schema::table('applications', function (Blueprint $table) {
            $table->string('identity_bvn', 11)->nullable()->change();
            $table->json('identity_bvn_data')->nullable()->change();
        });
    }
};
