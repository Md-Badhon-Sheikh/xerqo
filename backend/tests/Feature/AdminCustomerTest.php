<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\SmsGateway;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCustomerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $this->product = Product::create(['category_id' => $category->id, 'name' => 'Wallet', 'slug' => 'wallet', 'sku' => 'W1', 'price' => 1000, 'stock' => 50, 'status' => 'active']);
        $this->admin = User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]);
    }

    private function order(User $user, string $status, float $total = 1000): void
    {
        Order::create([
            'order_number' => 'XQ-'.random_int(10000, 99999), 'user_id' => $user->id, 'name' => $user->name, 'phone' => $user->phone,
            'district' => 'Sylhet', 'address_line' => 'Road 1', 'delivery_zone' => 'outside_dhaka', 'subtotal' => $total, 'delivery_charge' => 0,
            'discount' => 0, 'total' => $total, 'payment_method' => 'cod', 'payment_status' => 'pending', 'status' => $status,
        ]);
    }

    public function test_segments_and_filters(): void
    {
        $vip = User::factory()->create(['name' => 'Vip Buyer']);
        $this->order($vip, 'delivered', 12000);
        $risky = User::factory()->create(['name' => 'Risky Buyer']);
        $this->order($risky, 'delivered');
        $this->order($risky, 'returned');
        $this->order($risky, 'returned');
        $regular = User::factory()->create(['name' => 'Regular Buyer']);
        $this->order($regular, 'delivered');
        User::factory()->create(['name' => 'Fresh Signup']);

        Sanctum::actingAs($this->admin);

        $rows = collect($this->getJson('/api/admin/customers')->assertOk()->json('data'))->keyBy('name');
        $this->assertSame('vip', $rows['Vip Buyer']['segment']);
        $this->assertSame('risky', $rows['Risky Buyer']['segment']);
        $this->assertSame(33, $rows['Risky Buyer']['success_rate']);
        $this->assertSame('regular', $rows['Regular Buyer']['segment']);
        $this->assertSame('new', $rows['Fresh Signup']['segment']);
        $this->assertArrayNotHasKey($this->admin->name, $rows->all()); // staff are not customers

        foreach (['vip' => 'Vip Buyer', 'risky' => 'Risky Buyer', 'regular' => 'Regular Buyer', 'new' => 'Fresh Signup'] as $segment => $name) {
            $this->getJson("/api/admin/customers?segment={$segment}")->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', $name);
        }
        $this->getJson('/api/admin/customers?district=Sylhet')->assertOk()->assertJsonCount(3, 'data');

        $this->getJson("/api/admin/customers/{$risky->id}")->assertOk()
            ->assertJsonPath('data.returned', 2)
            ->assertJsonPath('data.activity.0.type', fn ($t) => in_array($t, ['order', 'account'], true));
        $this->getJson("/api/admin/customers/{$this->admin->id}")->assertNotFound();
    }

    public function test_cod_block_is_enforced_at_checkout(): void
    {
        $customer = User::factory()->create(['phone' => '01712345678']);
        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/admin/customers/{$customer->id}", ['cod_blocked' => true, 'admin_note' => 'Refused 3 parcels'])
            ->assertOk()->assertJsonPath('data.cod_blocked', true)->assertJsonPath('data.segment', 'risky');

        Sanctum::actingAs($customer->refresh());
        $order = ['name' => 'R', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'Road 1', 'items' => [['product_id' => $this->product->id, 'qty' => 1]]];
        $this->postJson('/api/orders', [...$order, 'payment_method' => 'cod'])->assertUnprocessable()->assertJsonValidationErrors('payment_method');
        $this->postJson('/api/orders', [...$order, 'payment_method' => 'bkash', 'transaction_id' => 'TX1', 'sender_number' => '01712345678'])->assertCreated();
        $this->getJson('/api/me')->assertJsonPath('data.cod_blocked', true);
    }

    public function test_disabling_an_account_signs_the_customer_out(): void
    {
        $customer = User::factory()->create();
        $customer->createToken('web');

        Sanctum::actingAs($this->admin);
        $this->patchJson("/api/admin/customers/{$customer->id}", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertSame(0, $customer->tokens()->count());
    }

    public function test_one_off_sms_uses_the_wallet_and_needs_edit_permission(): void
    {
        $customer = User::factory()->create(['phone' => '01812345678']);
        config(['services.sms.driver' => 'reve']);
        SmsGateway::current()->update(['balance_paisa' => 100, 'rate_paisa' => 35, 'api_key' => 'k', 'secret_key' => 's', 'sender_id' => 'XERQO']);
        Http::fake(['*' => Http::response(['Status' => '0', 'Message_ID' => '1'])]);

        Sanctum::actingAs($this->admin);
        $this->postJson("/api/admin/customers/{$customer->id}/sms", ['message' => 'Your parcel is ready'])->assertOk();
        $this->assertDatabaseHas('sms_logs', ['phone' => '01812345678', 'template' => 'manual', 'status' => 'sent', 'user_id' => $this->admin->id]);

        $viewer = Role::create(['name' => 'Viewer', 'slug' => 'viewer', 'permissions' => ['customers' => ['view']]]);
        Sanctum::actingAs(User::factory()->create(['role_id' => $viewer->id, 'is_active' => true]));
        $this->getJson("/api/admin/customers/{$customer->id}")->assertOk();
        $this->postJson("/api/admin/customers/{$customer->id}/sms", ['message' => 'Hi'])->assertForbidden();
        $this->patchJson("/api/admin/customers/{$customer->id}", ['cod_blocked' => true])->assertForbidden();
    }
}
