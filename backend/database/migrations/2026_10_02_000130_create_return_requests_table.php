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
        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reason');
            $table->text('details')->nullable();
            $table->enum('resolution', ['refund', 'exchange']);
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected', 'received', 'completed'])->default('pending');
            $table->json('photos')->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_requests');
    }
};
