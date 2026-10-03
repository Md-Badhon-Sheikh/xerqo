<?php

namespace Tests\Feature;

use App\Mail\PasswordResetCode;
use App\Mail\StaffInvite;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Mail::fake();
    }

    private function staff(string $slug, array $extra = []): User
    {
        return User::factory()->create(['role_id' => Role::where('slug', $slug)->value('id'), 'is_active' => true, ...$extra]);
    }

    public function test_invite_without_password_emails_a_set_password_link(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN, ['name' => 'Mahmud']));
        $roleId = Role::where('slug', 'order-manager')->value('id');

        $this->postJson('/api/admin/staff', ['name' => 'New Packer', 'email' => 'Packer@Xerqo.com', 'role_id' => $roleId])
            ->assertCreated()
            ->assertJsonPath('message', 'Invite sent to packer@xerqo.com.')
            ->assertJsonPath('data.last_login_at', null);

        Mail::assertQueued(StaffInvite::class, fn ($m) => $m->hasTo('packer@xerqo.com') && $m->invitedBy === 'Mahmud'
            && str_contains($m->render(), '/admin/forgot-password?identifier=packer%40xerqo.com'));

        // a password given by the admin -> no email
        $this->postJson('/api/admin/staff', ['name' => 'Second', 'email' => 'second@xerqo.com', 'role_id' => $roleId, 'password' => 'secret-123'])
            ->assertCreated()->assertJsonPath('message', 'Staff member added.');
        Mail::assertQueuedCount(1);

        $id = User::where('email', 'second@xerqo.com')->value('id');
        $this->postJson("/api/admin/staff/{$id}/invite")->assertOk();
        Mail::assertQueuedCount(2);
    }

    public function test_only_super_admin_can_grant_super_admin(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));
        $this->postJson('/api/admin/staff', ['name' => 'X', 'email' => 'x@xerqo.com', 'role_id' => Role::where('slug', Role::SUPER_ADMIN)->value('id')])->assertForbidden();
    }

    public function test_reset_code_goes_by_email_when_asked_with_an_email(): void
    {
        $member = $this->staff('order-manager', ['email' => 'rakib@xerqo.com', 'phone' => '01700000002']);

        $this->postJson('/api/auth/forgot-password', ['identifier' => 'rakib@xerqo.com'])->assertOk();
        Mail::assertSent(PasswordResetCode::class, fn ($m) => $m->hasTo('rakib@xerqo.com') && strlen($m->code) === 6);
        $this->assertDatabaseMissing('sms_logs', ['phone' => '01700000002']);
        $this->assertNotNull($member->id);
    }

    public function test_role_matrix_create_update_delete(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));

        $id = $this->postJson('/api/admin/roles', ['name' => 'Packer', 'permissions' => ['orders' => ['view', 'edit'], 'inventory' => ['view']]])
            ->assertCreated()->assertJsonPath('data.slug', 'packer')->json('data.id');

        $this->putJson("/api/admin/roles/{$id}", ['permissions' => ['orders' => ['view']], 'description' => 'Packs parcels'])
            ->assertOk()->assertJsonPath('data.permissions.orders', ['view'])->assertJsonMissingPath('data.permissions.inventory');

        $this->putJson('/api/admin/roles/'.Role::where('slug', Role::SUPER_ADMIN)->value('id'), ['name' => 'Boss'])->assertUnprocessable();

        $member = User::factory()->create(['role_id' => $id, 'is_active' => true]);
        $this->deleteJson("/api/admin/roles/{$id}")->assertUnprocessable();
        $member->delete();
        $this->deleteJson("/api/admin/roles/{$id}")->assertOk();
    }
}
