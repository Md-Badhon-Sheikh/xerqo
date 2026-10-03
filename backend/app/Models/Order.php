<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

    // manual payments for now (staff verify the transaction id / slip); a gateway can be added later
    public const PAYMENT_METHODS = ['cod', 'bkash', 'rocket', 'nagad', 'bank'];

    // mobile wallets need a transaction id + sender number
    public const WALLET_METHODS = ['bkash', 'rocket', 'nagad'];

    public const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

    public const ZONE_INSIDE_DHAKA = 'inside_dhaka';

    public const ZONE_OUTSIDE_DHAKA = 'outside_dhaka';

    /**
     * Allowed status transitions for the admin panel.
     */
    public const TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['packed', 'shipped', 'cancelled'],
        'packed' => ['shipped', 'cancelled'],
        'shipped' => ['delivered', 'returned', 'cancelled'],
        'delivered' => ['returned'],
        'cancelled' => [],
        'returned' => [],
    ];

    protected $fillable = [
        'order_number',
        'user_id',
        'name',
        'phone',
        'email',
        'district',
        'area',
        'address_line',
        'delivery_zone',
        'billing_name',
        'billing_phone',
        'billing_address',
        'subtotal',
        'delivery_charge',
        'discount',
        'total',
        'payment_method',
        'payment_status',
        'transaction_id',
        'status',
        'courier',
        'tracking_code',
        'coupon_id',
        'coupon_code',
        'note',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'float',
            'delivery_charge' => 'float',
            'discount' => 'float',
            'total' => 'float',
            'delivered_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at')->orderBy('id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function returnRequests(): HasMany
    {
        return $this->hasMany(ReturnRequest::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest('id');
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function canTransitionTo(string $status): bool
    {
        return in_array($status, self::TRANSITIONS[$this->status] ?? [], true);
    }

    public function isDelivered(): bool
    {
        return $this->status === 'delivered';
    }
}
