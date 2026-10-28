<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Setting;
use App\Services\CheckoutService;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * POST /api/orders — guest or authenticated checkout.
     *
     * Send the Bearer token (optional) to attach the order to the customer's account.
     */
    public function store(StoreOrderRequest $request, CheckoutService $checkout): JsonResponse
    {
        $user = $request->user('sanctum');

        if (! $user && ! Setting::getValue('auth.guest_checkout', true)) {
            abort(401, 'Please sign in to place an order.');
        }

        $order = $checkout->placeOrder($request->validated(), $user);

        // a guest gets a secret token for the thank-you page and the payment screenshot upload
        $guestToken = null;
        if (! $user) {
            $guestToken = Str::random(40);
            $order->forceFill(['guest_token' => hash('sha256', $guestToken)])->save();
        }

        return (new OrderResource($order))
            ->additional(['message' => 'Order placed successfully.', 'guest_token' => $guestToken])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/orders/track?order_number=XQ-24817&phone=01712345678
     */
    public function track(Request $request): OrderResource
    {
        $request->merge(['phone' => Phone::normalize($request->input('phone'))]);

        $data = $request->validate([
            'order_number' => ['required', 'string', 'max:20'],
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $order = Order::query()
            ->where('order_number', strtoupper(trim($data['order_number'])))
            ->where('phone', $data['phone'])
            ->with(['items', 'statusHistories', 'latestPayment'])
            ->first();

        abort_if($order === null, 404, 'No order found with this order number and phone.');

        return new OrderResource($order);
    }
}
