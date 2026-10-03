<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'brand_id',
        'is_featured',
        'name',
        'slug',
        'sku',
        'description',
        'price',
        'compare_price',
        'cost',
        'stock',
        'low_stock_threshold',
        'is_engravable',
        'badge',
        'status',
        'meta_title',
        'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'compare_price' => 'float',
            'cost' => 'float',
            'stock' => 'integer',
            'low_stock_threshold' => 'integer',
            'is_engravable' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function flashSaleItems(): HasMany
    {
        return $this->hasMany(FlashSaleItem::class);
    }

    /**
     * This product's entry in a flash sale that is running right now (if any).
     */
    public function activeFlashItem(): HasOne
    {
        return $this->hasOne(FlashSaleItem::class)
            ->whereHas('flashSale', fn (Builder $q) => $q->live())
            ->orderBy('sale_price');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order')->orderBy('id');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->ofMany(['sort_order' => 'min', 'id' => 'min']);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('status', Review::STATUS_APPROVED);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Eager-load rating aggregates used by ProductResource.
     */
    public function scopeWithRating(Builder $query): Builder
    {
        return $query->withAvg('approvedReviews as rating', 'rating')
            ->withCount('approvedReviews as reviews_count');
    }

    /**
     * Everything a storefront product card needs, loaded in a fixed number of queries.
     */
    public function scopeForCard(Builder $query): Builder
    {
        return $query->with(['category', 'brand', 'primaryImage', 'activeFlashItem.flashSale'])
            ->withCount(['variants' => fn (Builder $q) => $q->where('is_active', true)])
            ->withRating();
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Price the customer pays now: the live flash-sale price when lower than the regular price.
     */
    public function sellingPrice(): float
    {
        $sale = $this->activeFlashItem?->sale_price;

        return $sale !== null && $sale < $this->price ? $sale : $this->price;
    }

    /**
     * Price for a chosen option. Colour variants without their own price follow the product
     * (including any flash sale); a variant with its own price keeps that price.
     */
    public function priceFor(?ProductVariant $variant = null): float
    {
        return $variant?->price ?? $this->sellingPrice();
    }

    /**
     * "Was" price shown struck-through: the higher of compare_price and the regular price during a sale.
     */
    public function listPrice(): ?float
    {
        $selling = $this->sellingPrice();
        $was = max((float) $this->compare_price, $selling < $this->price ? $this->price : 0);

        return $was > $selling ? $was : null;
    }

    public function isLowStock(): bool
    {
        return $this->stock <= $this->low_stock_threshold;
    }

    public function discountPercent(): int
    {
        $was = $this->listPrice();

        return $was ? (int) round((($was - $this->sellingPrice()) / $was) * 100) : 0;
    }
}
