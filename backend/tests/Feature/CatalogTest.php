<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\FlashSale;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use App\Services\CheckoutService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    private Brand $brand;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true, 'show_on_home' => true]);
        $this->brand = Brand::create(['name' => 'XERQO Travel', 'slug' => 'xerqo-travel', 'is_active' => true]);
    }

    private function product(string $name, float $price, array $attributes = []): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => $name,
            'slug' => str($name)->slug(),
            'sku' => strtoupper(str($name)->slug()),
            'price' => $price,
            'stock' => 10,
            'status' => 'active',
            ...$attributes,
        ]);
    }

    private function flashSale(Product $product, float $salePrice, string $starts = '-1 hour', string $ends = '+1 day'): FlashSale
    {
        $sale = FlashSale::create(['title' => 'Flash Sale', 'starts_at' => now()->modify($starts), 'ends_at' => now()->modify($ends), 'is_active' => true]);
        $sale->items()->create(['product_id' => $product->id, 'sale_price' => $salePrice]);

        return $sale;
    }

    public function test_live_flash_sale_price_is_shown_and_charged(): void
    {
        $wallet = $this->product('Bifold Wallet', 1500, ['compare_price' => 1800]);
        $variant = $wallet->variants()->create(['name' => 'Black', 'color_hex' => '#231A15', 'stock' => 5, 'is_active' => true]);
        $this->flashSale($wallet, 1200);

        $this->getJson('/api/products/bifold-wallet')
            ->assertOk()
            ->assertJsonPath('data.price', 1200)
            ->assertJsonPath('data.compare_price', 1800)
            ->assertJsonPath('data.discount_percent', 33)
            ->assertJsonPath('data.flash_sale.title', 'Flash Sale')
            ->assertJsonPath('data.variants.0.price', 1200)
            ->assertJsonPath('data.variants.0.color_hex', '#231A15');

        // checkout charges the same price as the storefront shows
        $subtotal = app(CheckoutService::class)->subtotal([['product_id' => $wallet->id, 'variant_id' => $variant->id, 'qty' => 2]]);
        $this->assertSame(2400.0, $subtotal);
    }

    public function test_scheduled_and_expired_sales_do_not_change_the_price(): void
    {
        $upcoming = $this->product('Upcoming Wallet', 1000);
        $this->flashSale($upcoming, 700, '+1 hour', '+2 days');
        $expired = $this->product('Expired Wallet', 1000);
        $this->flashSale($expired, 700, '-2 days', '-1 hour');

        foreach (['upcoming-wallet', 'expired-wallet'] as $slug) {
            $this->getJson("/api/products/{$slug}")
                ->assertJsonPath('data.price', 1000)
                ->assertJsonPath('data.flash_sale', null);
        }
    }

    public function test_products_filter_by_brand_and_colour_with_facets(): void
    {
        $travel = $this->product('Passport Cover', 1200, ['brand_id' => $this->brand->id]);
        $travel->variants()->create(['name' => 'Navy', 'color_hex' => '#2B3550', 'stock' => 3, 'is_active' => true]);
        $this->product('Plain Wallet', 900);

        $this->getJson('/api/products?brand=xerqo-travel&color=Navy&with_facets=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'passport-cover')
            ->assertJsonPath('data.0.has_variants', true)
            ->assertJsonPath('facets.price.min', 900)
            ->assertJsonPath('facets.brands.0.slug', 'xerqo-travel')
            ->assertJsonPath('facets.colors.0.name', 'Navy');
    }

    public function test_home_returns_sections_and_the_live_flash_sale(): void
    {
        $wallet = $this->product('Bifold Wallet', 1500, ['is_featured' => true]);
        $this->flashSale($wallet, 1200);

        $this->getJson('/api/home')
            ->assertOk()
            ->assertJsonPath('flash_sale.products.0.price', 1200)
            ->assertJsonPath('sections.0.category.slug', 'wallets')
            ->assertJsonPath('top_selling.0.slug', 'bifold-wallet')
            ->assertJsonStructure(['banners', 'categories', 'reviews']);
    }

    public function test_admin_api_keeps_the_stored_price_during_a_sale(): void
    {
        $wallet = $this->product('Bifold Wallet', 1500);
        $this->flashSale($wallet, 1200);
        $this->seed(RoleSeeder::class);
        Sanctum::actingAs(User::factory()->create([
            'role_id' => Role::where('slug', Role::ADMIN)->value('id'),
            'is_active' => true,
        ]));

        $this->getJson("/api/admin/products/{$wallet->id}")
            ->assertOk()
            ->assertJsonPath('data.price', 1500);
    }
}
