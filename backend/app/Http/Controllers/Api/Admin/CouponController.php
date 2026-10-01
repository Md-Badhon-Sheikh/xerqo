<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
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

        return CouponResource::collection($coupons);
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
