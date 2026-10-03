<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Private delivery & service feedback a customer leaves for a delivered order.
 */
class OrderFeedback extends Model
{
    protected $table = 'order_feedback';

    public const RATINGS = ['delivery_rating', 'packaging_rating', 'courier_rating', 'support_rating'];

    protected $fillable = [
        'order_id',
        'user_id',
        'delivery_rating',
        'packaging_rating',
        'courier_rating',
        'support_rating',
        'nps',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'delivery_rating' => 'integer',
            'packaging_rating' => 'integer',
            'courier_rating' => 'integer',
            'support_rating' => 'integer',
            'nps' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
