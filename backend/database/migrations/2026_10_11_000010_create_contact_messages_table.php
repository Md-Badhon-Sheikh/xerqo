<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // signed-in customer, if any
            $table->string('name', 100);
            $table->string('phone', 20);
            $table->string('subject', 60)->nullable();
            $table->string('order_number', 30)->nullable();
            $table->text('message');
            $table->string('attachment')->nullable(); // photo on the public disk
            $table->string('ip', 45)->nullable();
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
