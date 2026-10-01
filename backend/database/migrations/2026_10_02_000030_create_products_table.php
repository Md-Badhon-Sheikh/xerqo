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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku', 64)->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('compare_price', 10, 2)->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);
            $table->boolean('is_engravable')->default(false);
            $table->string('badge', 40)->nullable();
            $table->enum('status', ['draft', 'active', 'hidden'])->default('draft');
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->timestamps();

            $table->index(['status', 'category_id']);
            $table->index('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
