<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'product_id',
        'order_id',
        'rating',
        'title',
        'body',
        'photos',
        'status',
        'delivery_rating',
        'courier_rating',
        'packaging_rating',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'rating' => 'integer',
            'delivery_rating' => 'integer',
            'courier_rating' => 'integer',
            'packaging_rating' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
