<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    /**
     * GET /api/me/orders?status=delivered
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()->orders()
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->with(['items.product:id,slug', 'reviews:id,order_id,product_id'])
            ->withCount('items')
            ->latest()
            ->paginate(min($request->integer('per_page', 10), 50));

        return OrderResource::collection($orders);
    }

    /**
     * GET /api/me/orders/{order_number}
     */
    public function show(Request $request, string $orderNumber): OrderResource
    {
        $order = $request->user()->orders()
            ->where('order_number', $orderNumber)
            ->with(['items.product:id,slug', 'statusHistories', 'reviews:id,order_id,product_id', 'returnRequests'])
            ->firstOrFail();

        return new OrderResource($order);
    }
}
