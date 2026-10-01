<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * GET /api/admin/orders?status=&payment_method=&q=&from=&to=&per_page=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(Order::STATUSES)],
            'payment_method' => ['nullable', Rule::in(Order::PAYMENT_METHODS)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $orders = Order::query()
            ->with('items')
            ->withCount('items')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('payment_method'), fn ($q) => $q->where('payment_method', $request->input('payment_method')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('order_number', 'like', $term)
                    ->orWhere('name', 'like', $term)
                    ->orWhere('phone', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->input('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->input('to')))
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        return OrderResource::collection($orders);
    }

    /**
     * GET /api/admin/orders/{order_number}
     */
    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load([
            'user',
            'items.product:id,slug',
            'statusHistories.changedBy:id,name',
            'returnRequests',
        ]));
    }

    /**
     * PUT/PATCH /api/admin/orders/{order_number} — courier, tracking, payment status and (optionally) status.
     */
    public function update(UpdateOrderRequest $request, Order $order, OrderStatusService $statuses): OrderResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $order, $request, $statuses) {
            $order->update(collect($data)->only(['payment_status', 'transaction_id', 'courier', 'tracking_code'])->all());

            if (isset($data['status']) && $data['status'] !== $order->status) {
                $statuses->transition($order, $data['status'], $data['note'] ?? null, $request->user());
            }
        });

        return $this->show($order->refresh());
    }

    /**
     * PATCH /api/admin/orders/{order_number}/status {"status": "confirmed", "note": "...", "courier": "...", "tracking_code": "..."}
     */
    public function updateStatus(Request $request, Order $order, OrderStatusService $statuses): OrderResource
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
            'note' => ['nullable', 'string', 'max:500'],
            'courier' => ['nullable', 'string', 'max:50'],
            'tracking_code' => ['nullable', 'string', 'max:100'],
        ]);

        DB::transaction(function () use ($data, $order, $request, $statuses) {
            $shipping = array_filter([
                'courier' => $data['courier'] ?? null,
                'tracking_code' => $data['tracking_code'] ?? null,
            ]);

            if ($shipping !== []) {
                $order->update($shipping);
            }

            $statuses->transition($order, $data['status'], $data['note'] ?? null, $request->user());
        });

        return $this->show($order->refresh());
    }
}
