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
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->json('photos')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedTinyInteger('delivery_rating')->nullable();
            $table->unsignedTinyInteger('courier_rating')->nullable();
            $table->unsignedTinyInteger('packaging_rating')->nullable();
            $table->timestamps();

            // One review per product per order per customer.
            $table->unique(['user_id', 'product_id', 'order_id']);
            $table->index(['product_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
