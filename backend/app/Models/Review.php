<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    // quick tags a customer can tick on the review form
    public const TAGS = ['Great quality', 'Neat stitching', 'Smells like real leather', 'Worth the price', 'Nice colour', 'Fast delivery', 'Perfect gift'];

    protected $fillable = [
        'user_id',
        'product_id',
        'order_id',
        'rating',
        'title',
        'body',
        'tags',
        'is_anonymous',
        'photos',
        'status',
        'is_featured',
        'admin_reply',
        'replied_at',
        'replied_by',
        'delivery_rating',
        'courier_rating',
        'packaging_rating',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'tags' => 'array',
            'is_anonymous' => 'boolean',
            'is_featured' => 'boolean',
            'replied_at' => 'datetime',
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

    /**
     * Name shown publicly: "Rahim U." or "XERQO customer" for anonymous reviews.
     */
    public function publicName(): string
    {
        if ($this->is_anonymous || ! $this->user?->name) {
            return 'XERQO customer';
        }

        $parts = preg_split('/\s+/', trim($this->user->name));

        return count($parts) > 1 ? $parts[0].' '.mb_substr(end($parts), 0, 1).'.' : $parts[0];
    }
}
