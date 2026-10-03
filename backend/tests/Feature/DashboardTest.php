<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'name' => 'Wallet', 'slug' => 'wallet', 'sku' => 'W1', 'price' => 1000, 'stock' => 9, 'status' => 'active']);

        Sanctum::actingAs(User::factory()->create(['is_active' => true]));
        foreach (['cod', 'cod'] as $method) {
            $this->postJson('/api/orders', [
                'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'Road 1',
                'payment_method' => $method, 'items' => [['product_id' => $product->id, 'qty' => 1]],
            ])->assertCreated();
        }
        Order::latest('id')->first()->update(['status' => 'cancelled']);
    }

    public function test_dashboard_numbers_and_ranges(): void
    {
        Sanctum::actingAs(User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]));

        $this->getJson('/api/admin/dashboard?range=7d')
            ->assertOk()
            ->assertJsonPath('data.kpis.orders_today.value', 2)
            ->assertJsonPath('data.kpis.revenue_today.value', 1060) // the cancelled order is not a sale
            ->assertJsonPath('data.tasks.orders_pending', 1)
            ->assertJsonPath('data.orders_by_status.cancelled', 1)
            ->assertJsonCount(7, 'data.chart.points')
            ->assertJsonPath('data.chart.orders', 1)
            ->assertJsonPath('data.top_products.0.sold', 1);

        $this->getJson('/api/admin/dashboard?range=12m')->assertOk()->assertJsonCount(12, 'data.chart.points');
    }

    public function test_badges_only_cover_modules_the_role_can_open(): void
    {
        $role = Role::create(['name' => 'Packer', 'slug' => 'packer', 'permissions' => ['orders' => ['view']]]);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id, 'is_active' => true]));

        $this->getJson('/api/admin/badges')->assertOk()->assertExactJson(['data' => ['orders' => 1, 'notifications' => 0]]);
    }
}
