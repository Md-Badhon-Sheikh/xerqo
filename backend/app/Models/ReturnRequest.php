<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnRequest extends Model
{
    public const STATUSES = ['pending', 'approved', 'rejected', 'received', 'completed'];

    public const RESOLUTIONS = ['refund', 'exchange'];

    protected $fillable = [
        'order_id',
        'order_item_id',
        'user_id',
        'reason',
        'details',
        'resolution',
        'qty',
        'amount',
        'status',
        'photos',
        'admin_note',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'photos' => 'array',
            'amount' => 'float',
            'qty' => 'integer',
            'resolved_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
