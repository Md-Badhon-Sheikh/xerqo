<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'name',
        'variant_name',
        'sku',
        'image',
        'price',
        'qty',
        'total',
        'engraving_text',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'total' => 'float',
            'qty' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function returnRequests(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }
}
