<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_token')->nullable()->unique()->index();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('full_name')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('ndpr_consented')->default(false);
            $table->decimal('location_lat', 10, 7)->nullable();
            $table->decimal('location_lng', 10, 7)->nullable();
            $table->text('location_address')->nullable();
            $table->string('location_street')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_state')->nullable();
            $table->string('location_country')->nullable();
            $table->string('billing_street')->nullable();
            $table->string('billing_city')->nullable();
            $table->string('billing_state')->nullable();
            $table->string('billing_country')->nullable();
            $table->unsignedTinyInteger('current_step')->default(0);
            $table->string('building_type', 20)->nullable();
            $table->string('selected_plan', 50)->nullable();
            $table->integer('monthly_income')->nullable();
            $table->integer('monthly_bill')->nullable();
            $table->integer('monthly_generator')->nullable();
            $table->integer('total_load_watts')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('status', 20)->default('submitted');
            $table->foreignId('assigned_sales_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('decline_reason')->nullable();
            $table->json('decline_details')->nullable();
            $table->integer('deposit_amount')->nullable();
            $table->integer('monthly_lease_amount')->nullable();
            $table->string('esign_reference')->nullable();
            $table->timestamp('esign_signed_at')->nullable();
            $table->timestamp('esign_expires_at')->nullable();
            $table->timestamp('deposit_paid_at')->nullable();
            $table->timestamp('active_at')->nullable();
            $table->boolean('is_suspended')->default(false);
            $table->string('mandate_reference')->nullable();
            $table->string('mandate_type')->nullable();
            $table->timestamp('mandate_expires_at')->nullable();
            $table->timestamp('address_verified_at')->nullable();
            $table->text('address_notes')->nullable();
            $table->string('address_document_path')->nullable();
            $table->timestamp('identity_verified_at')->nullable();
            $table->string('identity_bvn', 11)->nullable();
            $table->json('identity_bvn_data')->nullable();
            $table->string('identity_document_path')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('submitted_at');
            $table->index('user_id');
            $table->index('assigned_sales_id');
            $table->index(['assigned_sales_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
