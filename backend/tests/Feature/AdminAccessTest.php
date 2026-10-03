<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        Route::middleware(['api', 'auth:sanctum', 'super-admin'])
            ->get('api/_test/super-only', fn () => response()->json(['ok' => true]));
    }

    private function staff(string $roleSlug, array $attributes = []): User
    {
        return User::factory()->create([
            'role_id' => Role::where('slug', $roleSlug)->value('id'),
            'is_active' => true,
            ...$attributes,
        ]);
    }

    public function test_staff_login_returns_role_flags(): void
    {
        $this->staff(Role::SUPER_ADMIN, ['email' => 'boss@xerqo.test', 'password' => Hash::make('secret-pass')]);

        $this->postJson('/api/auth/login', ['login' => 'boss@xerqo.test', 'password' => 'secret-pass'])
            ->assertOk()
            ->assertJsonPath('user.is_staff', true)
            ->assertJsonPath('user.is_super_admin', true)
            ->assertJsonStructure(['token', 'user' => ['role' => ['slug', 'permissions']]]);
    }

    public function test_customer_cannot_open_the_admin_api(): void
    {
        Sanctum::actingAs(User::factory()->create(['role_id' => null]));

        $this->getJson('/api/admin/staff')->assertForbidden();
    }

    public function test_admin_role_can_use_the_admin_api(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));

        $this->getJson('/api/admin/staff')->assertOk();
    }

    public function test_only_super_admin_passes_the_super_admin_middleware(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));
        $this->getJson('/api/_test/super-only')->assertForbidden();

        Sanctum::actingAs($this->staff(Role::SUPER_ADMIN));
        $this->getJson('/api/_test/super-only')->assertOk();
    }

    public function test_admin_cannot_grant_the_super_admin_role(): void
    {
        Sanctum::actingAs($this->staff(Role::ADMIN));

        $this->postJson('/api/admin/staff', [
            'name' => 'Sneaky',
            'email' => 'sneaky@xerqo.test',
            'password' => 'password123',
            'role_id' => Role::where('slug', Role::SUPER_ADMIN)->value('id'),
        ])->assertForbidden();
    }
}
