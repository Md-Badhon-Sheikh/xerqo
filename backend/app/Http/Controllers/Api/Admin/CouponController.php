<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CouponController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $coupons = Coupon::query()
            ->when($request->filled('q'), fn ($q) => $q->where('code', 'like', '%'.strtoupper(trim((string) $request->input('q'))).'%'))
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        $orders = Order::query()->whereNotNull('coupon_id')->where('status', '!=', 'cancelled');

        return CouponResource::collection($coupons)->additional([
            'summary' => [
                'active' => Coupon::where('is_active', true)
                    ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                    ->count(),
                'redemptions' => (int) Coupon::sum('used'),
                'discount_given' => round((float) (clone $orders)->sum('discount'), 2),
                'revenue_with_coupons' => round((float) (clone $orders)->sum('total'), 2),
            ],
        ]);
    }

    public function store(CouponRequest $request): JsonResponse
    {
        $coupon = Coupon::create($request->validated());

        return (new CouponResource($coupon))->response()->setStatusCode(201);
    }

    public function show(Coupon $coupon): CouponResource
    {
        return new CouponResource($coupon);
    }

    public function update(CouponRequest $request, Coupon $coupon): CouponResource
    {
        $coupon->update($request->validated());

        return new CouponResource($coupon);
    }

    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete(); // orders keep coupon_code; coupon_id is nulled

        return response()->json(['message' => 'Coupon deleted.']);
    }
}
