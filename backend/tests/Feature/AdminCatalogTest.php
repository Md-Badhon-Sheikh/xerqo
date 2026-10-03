<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Role;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\OrderStatusService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCatalogTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
        Sanctum::actingAs(User::factory()->create([
            'role_id' => Role::where('slug', Role::ADMIN)->value('id'),
            'is_active' => true,
        ]));
        $this->category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
    }

    private function product(array $attributes = []): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => 'Bifold Wallet',
            'slug' => 'bifold-wallet',
            'sku' => 'XQ-1',
            'price' => 1500,
            'stock' => 10,
            'status' => 'active',
            ...$attributes,
        ]);
    }

    public function test_creating_a_product_with_colours_sums_their_stock_and_logs_it(): void
    {
        $brand = Brand::create(['name' => 'XERQO', 'slug' => 'xerqo', 'is_active' => true]);

        $response = $this->postJson('/api/admin/products', [
            'category_id' => $this->category->id,
            'brand_id' => $brand->id,
            'name' => 'Slim Wallet',
            'sku' => 'xq-slim',
            'price' => 1200,
            'stock' => 999, // ignored: colours decide the stock
            'is_featured' => true,
            'status' => 'active',
            'variants' => [
                ['name' => 'Black', 'color_hex' => '#231A15', 'stock' => 4],
                ['name' => 'Tan', 'color_hex' => '#B9874E', 'stock' => 6],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.sku', 'XQ-SLIM')
            ->assertJsonPath('data.slug', 'slim-wallet')
            ->assertJsonPath('data.brand.slug', 'xerqo')
            ->assertJsonPath('data.is_featured', true)
            ->assertJsonPath('data.stock', 10)
            ->assertJsonPath('data.variants.1.color_hex', '#B9874E');

        $this->assertDatabaseHas('stock_movements', ['product_id' => $response->json('data.id'), 'change' => 10, 'type' => 'edit']);
    }

    public function test_invalid_colour_code_is_rejected(): void
    {
        $this->postJson('/api/admin/products', [
            'category_id' => $this->category->id, 'name' => 'X', 'sku' => 'X1', 'price' => 10,
            'variants' => [['name' => 'Black', 'color_hex' => 'black', 'stock' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('variants.0.color_hex');
    }

    public function test_product_list_has_tab_counts(): void
    {
        $this->product();
        $this->product(['slug' => 'draft-one', 'sku' => 'XQ-2', 'status' => 'draft', 'stock' => 0]);

        $this->getJson('/api/admin/products')
            ->assertOk()
            ->assertJsonPath('counts.total', 2)
            ->assertJsonPath('counts.draft', 1)
            ->assertJsonPath('counts.out_of_stock', 1);
    }

    public function test_stock_adjustment_is_logged_with_reason(): void
    {
        $product = $this->product();

        $this->postJson('/api/admin/inventory/adjust', ['product_id' => $product->id, 'type' => 'add', 'quantity' => 5, 'reason' => 'New batch'])
            ->assertOk()
            ->assertJsonPath('data.after', 15);

        $this->getJson('/api/admin/inventory/movements')
            ->assertOk()
            ->assertJsonPath('data.0.change', 5)
            ->assertJsonPath('data.0.stock_after', 15)
            ->assertJsonPath('data.0.reason', 'New batch');

        $this->getJson('/api/admin/inventory')->assertJsonPath('summary.units', 15);
    }

    public function test_flash_sale_price_must_be_below_regular_price(): void
    {
        $product = $this->product();

        $this->postJson('/api/admin/flash-sales', [
            'title' => 'Eid Sale', 'starts_at' => now()->toDateTimeString(), 'ends_at' => now()->addDay()->toDateTimeString(),
            'items' => [['product_id' => $product->id, 'sale_price' => 1500]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0.sale_price');

        $this->postJson('/api/admin/flash-sales', [
            'title' => 'Eid Sale', 'starts_at' => now()->subMinute()->toDateTimeString(), 'ends_at' => now()->addDay()->toDateTimeString(),
            'items' => [['product_id' => $product->id, 'sale_price' => 1200]],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'live')
            ->assertJsonPath('data.items.0.discount_percent', 20);
    }

    public function test_brand_crud(): void
    {
        $id = $this->postJson('/api/admin/brands', ['name' => 'XERQO Travel'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'xerqo-travel')
            ->json('data.id');

        $this->putJson("/api/admin/brands/{$id}", ['is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->deleteJson("/api/admin/brands/{$id}")->assertOk();
        $this->assertSame(0, Brand::count());
    }

    public function test_cancelling_an_order_restocks_and_logs(): void
    {
        $product = $this->product();
        $order = Order::create([
            'order_number' => 'XQ-T1', 'name' => 'A', 'phone' => '01712345678', 'district' => 'Dhaka', 'address_line' => 'x',
            'delivery_zone' => 'inside_dhaka', 'subtotal' => 1500, 'total' => 1560, 'payment_method' => 'cod', 'status' => 'pending',
        ]);
        $order->items()->create(['product_id' => $product->id, 'name' => $product->name, 'sku' => $product->sku, 'price' => 1500, 'qty' => 2, 'total' => 3000]);

        app(OrderStatusService::class)->transition($order, 'cancelled');

        $this->assertSame(12, $product->fresh()->stock);
        $this->assertSame(1, StockMovement::where(['type' => 'cancel', 'reference' => 'XQ-T1', 'change' => 2])->count());
    }
}
