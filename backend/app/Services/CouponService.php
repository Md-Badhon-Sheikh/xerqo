<?php

namespace App\Services;

use App\Models\Coupon;
use Illuminate\Validation\ValidationException;

class CouponService
{
    /**
     * Find a coupon by code and make sure it can be applied to the subtotal.
     *
     * @param  bool  $lock  lock the coupon row (use inside the checkout transaction)
     *
     * @throws ValidationException
     */
    public function resolve(string $code, float $subtotal, bool $lock = false): Coupon
    {
        $query = Coupon::query()->where('code', strtoupper(trim($code)));

        if ($lock) {
            $query->lockForUpdate();
        }

        $coupon = $query->first();

        $error = match (true) {
            $coupon === null, ! $coupon->is_active => 'This coupon code is invalid.',
            $coupon->starts_at !== null && $coupon->starts_at->isFuture() => 'This coupon is not active yet.',
            $coupon->ends_at !== null && $coupon->ends_at->isPast() => 'This coupon has expired.',
            $coupon->max_uses !== null && $coupon->used >= $coupon->max_uses => 'This coupon has reached its usage limit.',
            $subtotal < $coupon->min_order => 'Minimum order for this coupon is ৳'.number_format($coupon->min_order).'.',
            default => null,
        };

        if ($error !== null) {
            throw ValidationException::withMessages(['coupon_code' => $error]);
        }

        return $coupon;
    }
}
