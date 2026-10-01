<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    public const TYPE_PERCENT = 'percent';

    public const TYPE_FIXED = 'fixed';

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'min_order',
        'max_discount',
        'max_uses',
        'used',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'float',
            'min_order' => 'float',
            'max_discount' => 'float',
            'max_uses' => 'integer',
            'used' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Store codes upper-case so lookups are case-insensitive for customers.
     */
    public function setCodeAttribute(string $value): void
    {
        $this->attributes['code'] = strtoupper(trim($value));
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Discount amount for a given subtotal (does not check validity).
     */
    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === self::TYPE_PERCENT
            ? round($subtotal * $this->value / 100)
            : $this->value;

        if ($this->max_discount !== null) {
            $discount = min($discount, $this->max_discount);
        }

        return (float) min($discount, $subtotal);
    }
}
