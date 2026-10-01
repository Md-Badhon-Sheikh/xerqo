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
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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

    public function isLowStock(): bool
    {
        return $this->stock <= $this->low_stock_threshold;
    }

    public function discountPercent(): int
    {
        if (! $this->compare_price || $this->compare_price <= $this->price) {
            return 0;
        }

        return (int) round((($this->compare_price - $this->price) / $this->compare_price) * 100);
    }
}
