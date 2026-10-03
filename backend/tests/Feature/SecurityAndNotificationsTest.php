<?php

namespace Tests\Feature;

use App\Mail\StaffAlertMail;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAndNotificationsTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $this->product = Product::create(['category_id' => $category->id, 'name' => 'Wallet', 'slug' => 'wallet', 'sku' => 'W1', 'price' => 1000, 'stock' => 6, 'low_stock_threshold' => 5, 'status' => 'active']);
    }

    private function staff(string $slug, array $extra = []): User
    {
        return User::factory()->create(['role_id' => Role::where('slug', $slug)->value('id'), 'is_active' => true, ...$extra]);
    }

    private function placeOrder(): string
    {
        Sanctum::actingAs(User::factory()->create(['is_active' => true]));

        return $this->postJson('/api/orders', [
            'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'Road 1',
            'payment_method' => 'cod', 'items' => [['product_id' => $this->product->id, 'qty' => 1]],
        ])->assertCreated()->json('data.order_number');
    }

    public function test_new_order_and_low_stock_alert_the_right_staff(): void
    {
        Mail::fake();
        $admin = $this->staff(Role::ADMIN, ['notification_prefs' => ['new_order' => ['app' => true, 'email' => true]]]);
        $support = $this->staff('content-editor');    // can't open orders or inventory
        $inventory = $this->staff('inventory');       // inventory only

        $number = $this->placeOrder();                // stock 6 -> 5 = low

        $this->assertEqualsCanonicalizing(['new_order', 'low_stock'], $admin->notifications()->get()->pluck('data.event')->all());
        $this->assertSame(0, $support->notifications()->count());
        $this->assertSame(['low_stock'], $inventory->notifications()->get()->pluck('data.event')->all());
        Mail::assertQueued(StaffAlertMail::class, fn ($m) => $m->hasTo($admin->email) && str_contains($m->alert['title'], $number));
        Mail::assertQueued(StaffAlertMail::class, 1);

        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/badges')->assertJsonPath('data.notifications', 2);
        $this->getJson('/api/admin/notifications?category=stock')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('counts.orders', 1);
        $id = $this->getJson('/api/admin/notifications')->json('data.0.id');
        $this->postJson('/api/admin/notifications/read', ['ids' => [$id]])->assertJsonPath('unread', 1);
        $this->postJson('/api/admin/notifications/read')->assertJsonPath('unread', 0);
        $this->deleteJson("/api/admin/notifications/{$id}")->assertOk();
        $this->assertSame(1, $admin->notifications()->count());

        // turning the in-app alert off stops it
        $this->putJson('/api/admin/notifications/preferences', ['prefs' => ['new_order' => ['app' => false, 'email' => false]]])
            ->assertOk()->assertJsonFragment(['event' => 'new_order', 'app' => false]);
        $this->placeOrder();
        $this->assertSame(1, $admin->notifications()->where('data->event', 'new_order')->count());
    }

    public function test_admin_changes_and_sign_ins_are_logged(): void
    {
        $admin = $this->staff(Role::ADMIN, ['email' => 'boss@xerqo.test', 'password' => Hash::make('secret-pass')]);
        $number = $this->placeOrder();
        $this->app['auth']->forgetGuards(); // from here on, requests use the real token

        $this->postJson('/api/auth/login', ['login' => 'boss@xerqo.test', 'password' => 'nope'])->assertUnprocessable();
        $token = $this->postJson('/api/auth/login', ['login' => 'boss@xerqo.test', 'password' => 'secret-pass'], ['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0'])->json('token');

        $this->withToken($token)->patchJson("/api/admin/orders/{$number}/status", ['status' => 'confirmed'])->assertOk();
        $this->withToken($token)->putJson('/api/admin/settings', ['settings' => ['delivery' => ['inside_dhaka' => 70]]])->assertOk();
        $this->withToken($token)->putJson('/api/admin/settings', ['settings' => ['delivery' => ['inside_dhaka' => 'x']]])->assertUnprocessable(); // failures aren't logged

        $this->assertSame([
            'Failed sign-in (wrong password)',
            'Signed in',
            "Order #{$number} → confirmed",
            'Changed settings: delivery',
        ], ActivityLog::oldest('id')->pluck('description')->all());
        $this->assertSame($admin->id, ActivityLog::where('action', 'auth.login_failed')->value('user_id'));

        $this->withToken($token)->getJson('/api/admin/security/activity?category=orders')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.user', $admin->name)->assertJsonPath('failed_logins_7d', 1);
        $this->withToken($token)->getJson('/api/admin/profile/sessions')->assertOk()
            ->assertJsonPath('data.0.device', 'Chrome · Windows')->assertJsonPath('data.0.current', true);
    }

    public function test_password_change_signs_out_other_devices(): void
    {
        $admin = $this->staff(Role::ADMIN, ['email' => 'me@xerqo.test', 'password' => Hash::make('old-password')]);
        $other = $admin->createToken('phone')->plainTextToken;
        $mine = $this->postJson('/api/auth/login', ['login' => 'me@xerqo.test', 'password' => 'old-password'])->json('token');

        $this->withToken($mine)->putJson('/api/admin/profile/password', ['current_password' => 'wrong', 'password' => 'new-password-1', 'password_confirmation' => 'new-password-1'])
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->withToken($mine)->putJson('/api/admin/profile/password', ['current_password' => 'old-password', 'password' => 'new-password-1', 'password_confirmation' => 'new-password-1'])
            ->assertOk()->assertJsonPath('message', 'Password updated · signed out of 1 other device.');

        $this->assertSame(1, $admin->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->withToken($other)->getJson('/api/admin/profile')->assertUnauthorized();
    }

    public function test_only_super_admin_signs_out_other_staff(): void
    {
        $admin = $this->staff(Role::ADMIN);
        $admin->createToken('x');
        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/security/sessions')->assertOk();
        $this->deleteJson('/api/admin/security/sessions')->assertForbidden();

        Sanctum::actingAs($this->staff(Role::SUPER_ADMIN));
        $this->deleteJson('/api/admin/security/sessions')->assertOk();
        $this->assertSame(0, $admin->tokens()->count());
        $this->assertSame(0, Order::count());
    }
}
