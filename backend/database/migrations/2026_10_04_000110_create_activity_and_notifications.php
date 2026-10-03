<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // audit trail of staff actions and sign-ins
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 60)->index();       // e.g. order.status, login.failed
            $table->string('category', 20)->index();     // orders, payments, catalog, customers, settings, staff, sms, auth …
            $table->string('description');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('properties')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('device', 120)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });

        // Laravel database notifications (staff in-app alerts)
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->json('notification_prefs')->nullable()->after('admin_note'); // staff: {"new_order": {"app": true, "email": false}, …}
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('ip', 45)->nullable()->after('abilities');
            $table->string('device', 120)->nullable()->after('ip');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', fn (Blueprint $t) => $t->dropColumn(['ip', 'device']));
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('notification_prefs'));
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_logs');
    }
};
