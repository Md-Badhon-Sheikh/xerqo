<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 20)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('phone', 20)->index();
            $table->string('email')->nullable();
            $table->string('district', 100);
            $table->string('area', 100)->nullable();
            $table->string('address_line', 500);
            $table->enum('delivery_zone', ['inside_dhaka', 'outside_dhaka']);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_charge', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->enum('payment_method', ['cod', 'bkash', 'nagad', 'card'])->default('cod');
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->string('transaction_id', 100)->nullable();
            $table->enum('status', ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'])->default('pending');
            $table->string('courier', 50)->nullable();
            $table->string('tracking_code', 100)->nullable();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('coupon_code', 50)->nullable();
            $table->text('note')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
