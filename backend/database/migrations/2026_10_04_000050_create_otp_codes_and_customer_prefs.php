<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One-time codes sent by SMS: login, registration and phone-number change
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('identifier', 100); // normalised phone number
            $table->string('purpose', 30); // login | register | phone_change
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['identifier', 'purpose', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('phone_verified_at')->nullable()->after('phone');
            $table->date('date_of_birth')->nullable()->after('avatar');
            // customer notification preferences
            $table->boolean('notify_order_sms')->default(true)->after('date_of_birth');
            $table->boolean('marketing_sms')->default(false)->after('notify_order_sms');
            $table->boolean('marketing_email')->default(false)->after('marketing_sms');
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['phone_verified_at', 'date_of_birth', 'notify_order_sms', 'marketing_sms', 'marketing_email']));
        Schema::dropIfExists('otp_codes');
    }
};
