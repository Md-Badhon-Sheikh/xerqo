<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('spent_on')->index();
            $table->string('category', 30)->index();
            $table->decimal('amount', 12, 2);
            $table->string('method', 20)->default('cash'); // cash, bkash, nagad, rocket, bank, card
            $table->string('description');
            $table->string('reference', 100)->nullable(); // bill / TrxID
            $table->string('receipt')->nullable();       // uploaded file
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
