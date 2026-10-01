<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CheckoutService;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * POST /api/coupons/validate
     * Body: {"code": "XERQO500", "subtotal": 3200} or {"code": "...", "items": [{"product_id": 1, "qty": 2}]}
     */
    public function check(Request $request, CouponService $coupons, CheckoutService $checkout): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'subtotal' => ['required_without:items', 'nullable', 'numeric', 'min:0'],
            'items' => ['required_without:subtotal', 'nullable', 'array'],
            'items.*.product_id' => ['required_with:items', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.qty' => ['required_with:items', 'integer', 'min:1'],
            'delivery_zone' => ['nullable', 'in:inside_dhaka,outside_dhaka,inside,outside'],
        ]);

        // Prefer server-side pricing when the cart items are sent.
        $subtotal = ! empty($data['items'])
            ? $checkout->subtotal($data['items'])
            : (float) $data['subtotal'];

        $coupon = $coupons->resolve($data['code'], $subtotal);
        $discount = $coupon->discountFor($subtotal);

        $response = [
            'valid' => true,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'description' => $coupon->description,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'message' => 'Coupon applied: you save ৳'.number_format($discount).'.',
        ];

        if (! empty($data['delivery_zone'])) {
            $zone = str_starts_with($data['delivery_zone'], 'inside') ? 'inside_dhaka' : 'outside_dhaka';
            $response['delivery_charge'] = $checkout->deliveryCharge($zone, $subtotal);
            $response['total'] = max(0, $subtotal - $discount + $response['delivery_charge']);
        }

        return response()->json($response);
    }
}
