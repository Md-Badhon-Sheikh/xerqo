<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // cod | bkash | rocket | nagad | bank (a gateway can be added later without another enum change)
            $table->string('payment_method', 20)->default('cod')->change();

            // separate billing address; null = same as the delivery address
            $table->string('billing_name')->nullable()->after('delivery_zone');
            $table->string('billing_phone', 20)->nullable()->after('billing_name');
            $table->string('billing_address', 500)->nullable()->after('billing_phone');
        });

        // Manual payment submissions: mobile-wallet transaction id / sender number, or a bank deposit slip.
        // Staff verify or reject each one; a rejected payment can be submitted again.
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('method', 20);
            $table->decimal('amount', 10, 2);
            $table->string('transaction_id', 100)->nullable();
            $table->string('sender_number', 20)->nullable();
            $table->string('proof')->nullable(); // screenshot / deposit slip path
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['billing_name', 'billing_phone', 'billing_address']);
        });
    }
};
