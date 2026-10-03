<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderFeedback;
use App\Models\Product;
use App\Models\Review;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Product $product;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, SettingSeeder::class]);
        $category = Category::create(['name' => 'Wallets', 'slug' => 'wallets', 'is_active' => true]);
        $this->product = Product::create(['category_id' => $category->id, 'name' => 'Bifold Wallet', 'slug' => 'bifold', 'sku' => 'W1', 'price' => 1000, 'stock' => 5, 'status' => 'active']);
        $this->customer = User::factory()->create(['name' => 'Rahim Uddin', 'is_active' => true]);

        $this->order = Order::create([
            'order_number' => 'XQ-50001', 'user_id' => $this->customer->id, 'name' => 'Rahim', 'phone' => '01712345678', 'district' => 'Dhaka',
            'address_line' => 'Road 1', 'delivery_zone' => 'inside_dhaka', 'subtotal' => 1000, 'delivery_charge' => 60, 'discount' => 0, 'total' => 1060,
            'payment_method' => 'cod', 'payment_status' => 'paid', 'status' => 'delivered', 'delivered_at' => now(), 'courier' => 'Steadfast',
        ]);
        $this->order->items()->create(['product_id' => $this->product->id, 'name' => 'Bifold Wallet', 'price' => 1000, 'qty' => 1, 'total' => 1000]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role_id' => Role::where('slug', Role::ADMIN)->value('id'), 'is_active' => true]);
    }

    public function test_customer_reviews_edits_and_leaves_feedback(): void
    {
        Sanctum::actingAs($this->customer);

        $this->getJson('/api/me/orders/XQ-50001/review')->assertOk()
            ->assertJsonPath('data.can_review', true)
            ->assertJsonPath('data.items.0.review', null);

        $id = $this->postJson('/api/reviews', [
            'order_number' => 'XQ-50001', 'product_id' => $this->product->id, 'rating' => 5, 'body' => 'Lovely leather',
            'tags' => ['Great quality', 'Not a real tag'], 'is_anonymous' => true,
        ])->assertCreated()->assertJsonPath('data.tags', ['Great quality'])->json('data.id');

        $this->postJson('/api/me/orders/XQ-50001/feedback', ['delivery_rating' => 5, 'courier_rating' => 4, 'nps' => 9, 'comment' => 'Rider called first'])->assertOk();
        $this->postJson('/api/me/orders/XQ-50001/feedback', ['nps' => 10])->assertOk(); // updates, not duplicates
        $this->assertSame(1, OrderFeedback::count());

        $this->getJson('/api/me/reviews')->assertOk()
            ->assertJsonCount(0, 'to_review')
            ->assertJsonPath('feedback.0.nps', 10)
            ->assertJsonPath('data.0.is_anonymous', true);

        // approved, then edited -> back to moderation
        Review::find($id)->update(['status' => 'approved', 'is_featured' => true]);
        $this->putJson("/api/reviews/{$id}", ['rating' => 4, 'body' => 'Still lovely', 'tags' => [], 'is_anonymous' => false])
            ->assertOk()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.is_featured', false);

        // someone else cannot touch it
        Sanctum::actingAs(User::factory()->create());
        $this->deleteJson("/api/reviews/{$id}")->assertNotFound();
        $this->getJson('/api/me/orders/XQ-50001/review')->assertNotFound();
    }

    public function test_public_reviews_hide_full_names_and_show_replies(): void
    {
        $review = Review::create(['user_id' => $this->customer->id, 'product_id' => $this->product->id, 'order_id' => $this->order->id, 'rating' => 5, 'body' => 'Great', 'status' => 'approved']);

        Sanctum::actingAs($this->staff());
        $this->patchJson("/api/admin/reviews/{$review->id}/reply", ['reply' => 'Thank you Rahim!'])->assertOk()->assertJsonPath('data.reply', 'Thank you Rahim!');
        $this->patchJson("/api/admin/reviews/{$review->id}/feature", ['is_featured' => true])->assertOk()->assertJsonPath('data.is_featured', true);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/products/bifold/reviews')->assertOk()
            ->assertJsonPath('data.0.author.name', 'Rahim U.')
            ->assertJsonPath('data.0.reply', 'Thank you Rahim!')
            ->assertJsonMissingPath('data.0.delivery_rating');

        $review->update(['is_anonymous' => true]);
        $this->getJson('/api/products/bifold/reviews')->assertJsonPath('data.0.author.name', 'XERQO customer');
        $this->getJson('/api/home')->assertJsonPath('reviews.0.id', $review->id);
    }

    public function test_admin_moderation_counts_and_feedback_summary(): void
    {
        $pending = Review::create(['user_id' => $this->customer->id, 'product_id' => $this->product->id, 'order_id' => $this->order->id, 'rating' => 2, 'body' => 'Loose clasp', 'status' => 'pending']);
        OrderFeedback::create(['order_id' => $this->order->id, 'user_id' => $this->customer->id, 'delivery_rating' => 4, 'nps' => 10, 'comment' => 'Fast']);

        Sanctum::actingAs($this->staff());
        $this->getJson('/api/admin/reviews?status=pending')->assertOk()
            ->assertJsonPath('counts.pending', 1)
            ->assertJsonPath('summary.nps', 100)
            ->assertJsonPath('data.0.customer.name', 'Rahim Uddin');
        $this->getJson('/api/admin/reviews?q=clasp')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/reviews?q=nothing-like-this')->assertOk()->assertJsonCount(0, 'data');

        $this->patchJson("/api/admin/reviews/{$pending->id}/feature", ['is_featured' => true])->assertStatus(422); // approve first
        $this->patchJson("/api/admin/reviews/{$pending->id}/approve")->assertOk()->assertJsonPath('data.status', 'approved');

        $this->getJson('/api/admin/reviews/feedback')->assertOk()
            ->assertJsonPath('summary.responses', 1)
            ->assertJsonPath('summary.averages.delivery_rating', 4)
            ->assertJsonPath('summary.latest_comment.comment', 'Fast')
            ->assertJsonPath('data.0.order_number', 'XQ-50001');
    }
}
