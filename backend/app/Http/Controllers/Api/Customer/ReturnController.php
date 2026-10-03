<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreReturnRequest;
use App\Http\Resources\ReturnRequestResource;
use App\Models\ReturnRequest;
use App\Models\Setting;
use App\Services\AdminNotifier;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ReturnController extends Controller
{
    /**
     * GET /api/me/returns
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $returns = $request->user()->returnRequests()
            ->with(['order:id,order_number,name,phone', 'orderItem'])
            ->latest()
            ->get();

        return ReturnRequestResource::collection($returns);
    }

    /**
     * POST /api/returns — return / exchange request for an item of a delivered order
     * within the return window (setting returns.window_days, default 7).
     */
    public function store(StoreReturnRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $order = $user->orders()
            ->when(
                ! empty($data['order_number']),
                fn ($q) => $q->where('order_number', $data['order_number']),
                fn ($q) => $q->whereKey($data['order_id']),
            )
            ->first();

        if (! $order) {
            throw ValidationException::withMessages(['order_number' => 'Order not found in your account.']);
        }

        if (! $order->isDelivered()) {
            throw ValidationException::withMessages(['order_number' => 'Only delivered orders can be returned.']);
        }

        $windowDays = (int) Setting::getValue('returns.window_days', 7);
        if ($windowDays <= 0) {
            throw ValidationException::withMessages(['order_number' => 'Returns can’t be requested online right now — please call or WhatsApp us.']);
        }
        if ($order->delivered_at && $order->delivered_at->copy()->addDays($windowDays)->isPast()) {
            throw ValidationException::withMessages(['order_number' => "The {$windowDays}-day return window for this order has closed."]);
        }

        $item = $order->items()->whereKey($data['order_item_id'])->first();
        if (! $item) {
            throw ValidationException::withMessages(['order_item_id' => 'This item is not part of the order.']);
        }

        $openOrDone = ReturnRequest::where('order_item_id', $item->id)
            ->whereIn('status', ['pending', 'approved', 'received', 'completed'])
            ->exists();
        if ($openOrDone) {
            throw ValidationException::withMessages(['order_item_id' => 'A return request already exists for this item.']);
        }

        $qty = min((int) ($data['qty'] ?? $item->qty), $item->qty);

        $photos = [];
        foreach ($request->file('photos', []) as $photo) {
            $photos[] = Media::store($photo, 'returns');
        }

        $return = ReturnRequest::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'user_id' => $user->id,
            'reason' => $data['reason'],
            'details' => $data['details'] ?? null,
            'resolution' => $data['resolution'],
            'qty' => $qty,
            'amount' => $data['resolution'] === 'refund' ? $item->price * $qty : 0,
            'status' => 'pending',
            'photos' => $photos ?: null,
        ]);

        app(AdminNotifier::class)->notify(
            'return',
            "Return requested on #{$order->order_number}",
            "{$item->name} · {$data['reason']} · wants ".($data['resolution'] === 'refund' ? 'a refund' : 'an exchange'),
            '/admin/returns',
        );

        return (new ReturnRequestResource($return->load(['order', 'orderItem'])))
            ->additional(['message' => 'Return request submitted. We will contact you shortly.'])
            ->response()
            ->setStatusCode(201);
    }
}
