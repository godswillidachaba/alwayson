<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installation_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('installer_ticket_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->boolean('is_done')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('installer_ticket_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installation_checklist_items');
    }
};
