<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A single row: the Reve SMS account plus the store's prepaid SMS wallet (Super Admin only).
        // Kept out of the settings table so the API keys never appear in /api/admin/settings.
        Schema::create('sms_gateway', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 30)->default('reve');
            $table->boolean('is_enabled')->default(true);
            $table->string('api_url')->default('https://smpp.revesms.com:7790');
            $table->string('balance_url')->default('https://smpp.revesms.com');
            $table->text('api_key')->nullable();      // encrypted
            $table->text('secret_key')->nullable();   // encrypted
            $table->string('sender_id', 30)->nullable();
            $table->string('client_id', 60)->nullable(); // Reve account id, only for the remote balance check
            $table->unsignedInteger('rate_paisa')->default(35);           // price of one SMS segment
            $table->bigInteger('balance_paisa')->default(0);
            $table->unsignedInteger('low_balance_paisa')->default(10000); // alert below ৳100
            $table->timestamp('low_alert_sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_recharges', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('amount_paisa'); // negative for a correction
            $table->bigInteger('balance_after_paisa');
            $table->unsignedInteger('rate_paisa');
            $table->string('note')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->index();
            $table->text('message');
            $table->string('template', 50)->nullable()->index();
            $table->string('encoding', 10)->default('gsm');
            $table->unsignedSmallInteger('segments')->default(1);
            $table->unsignedInteger('cost_paisa')->default(0);
            $table->string('status', 10)->index(); // sent, failed, skipped
            $table->string('reason')->nullable();
            $table->string('gateway_message_id', 100)->nullable();
            $table->text('gateway_response')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // staff who sent a test SMS
            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_recharges');
        Schema::dropIfExists('sms_gateway');
    }
};
