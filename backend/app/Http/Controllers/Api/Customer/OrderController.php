<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\AdminNotifier;
use App\Support\Media;
use App\Support\Phone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * GET /api/me/orders?status=&per_page=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()->orders()
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->with(['items.product:id,slug', 'reviews:id,order_id,product_id', 'latestPayment'])
            ->withCount('items')
            ->latest()
            ->paginate(min($request->integer('per_page', 10), 50));

        return OrderResource::collection($orders);
    }

    /**
     * GET /api/me/orders/{orderNumber}
     */
    public function show(Request $request, string $orderNumber): OrderResource
    {
        return new OrderResource($this->find($request, $orderNumber));
    }

    /**
     * POST /api/me/orders/{orderNumber}/payment (multipart)
     * {transaction_id, sender_number, proof (screenshot / deposit slip)}
     *
     * Adds the screenshot/slip to a pending payment, or submits a new one after a rejection.
     */
    public function submitPayment(Request $request, string $orderNumber): OrderResource
    {
        $order = $this->find($request, $orderNumber);

        if ($order->payment_method === 'cod') {
            throw ValidationException::withMessages(['payment' => 'Cash on Delivery orders are paid to the rider.']);
        }
        if ($order->payment_status === 'paid') {
            throw ValidationException::withMessages(['payment' => 'This order is already paid.']);
        }
        if (in_array($order->status, ['cancelled', 'returned'], true)) {
            throw ValidationException::withMessages(['payment' => 'This order was '.$order->status.'.']);
        }

        $wallet = in_array($order->payment_method, Order::WALLET_METHODS, true);
        $current = $order->latestPayment;
        $reuse = $current && $current->status === Payment::STATUS_PENDING;

        $request->merge([
            'transaction_id' => $request->filled('transaction_id') ? strtoupper(trim((string) $request->input('transaction_id'))) : null,
            'sender_number' => $request->filled('sender_number') ? Phone::normalize($request->input('sender_number')) : null,
        ]);
        $data = $request->validate([
            'transaction_id' => [$wallet && ! ($reuse && $current->transaction_id) ? 'required' : 'nullable', 'string', 'max:100',
                function (string $attribute, mixed $value, \Closure $fail) use ($current, $reuse) {
                    $taken = $value && Payment::where('transaction_id', $value)
                        ->where('status', '!=', Payment::STATUS_REJECTED)
                        ->when($reuse, fn ($q) => $q->whereKeyNot($current->id))
                        ->exists();
                    if ($taken) {
                        $fail('This transaction ID has already been used for another order.');
                    }
                }],
            'sender_number' => [$wallet && ! ($reuse && $current->sender_number) ? 'required' : 'nullable', 'string', 'regex:'.Phone::REGEX],
            // a bank transfer needs its deposit slip / transfer receipt
            'proof' => [$order->payment_method === 'bank' && ! ($reuse && $current->proof) ? 'required' : 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'proof.required' => 'Upload the deposit slip or transfer receipt.',
            'transaction_id.required' => 'Enter the transaction ID from your payment SMS.',
        ]);

        $attributes = array_filter([
            'transaction_id' => $data['transaction_id'] ?? null,
            'sender_number' => $data['sender_number'] ?? null,
        ]);
        if ($request->hasFile('proof')) {
            $attributes['proof'] = Media::store($request->file('proof'), 'payments');
        }

        if ($reuse) {
            if (isset($attributes['proof'])) {
                Media::delete($current->proof);
            }
            $current->update($attributes);
        } else {
            $order->payments()->create([...$attributes, 'method' => $order->payment_method, 'amount' => $order->total, 'status' => Payment::STATUS_PENDING]);
            app(AdminNotifier::class)->notify(
                'payment',
                "Payment sent for #{$order->order_number}",
                strtoupper($order->payment_method).' · ৳'.number_format($order->total).(! empty($attributes['transaction_id']) ? " · TxnID {$attributes['transaction_id']}" : ' · slip uploaded'),
                '/admin/payments',
            );
            $order->update(['payment_status' => 'pending']);
        }

        return new OrderResource($this->find($request, $orderNumber));
    }

    private function find(Request $request, string $orderNumber): Order
    {
        return $request->user()->orders()
            ->where('order_number', $orderNumber)
            ->with(['items.product:id,slug', 'statusHistories', 'reviews:id,order_id,product_id', 'returnRequests', 'latestPayment'])
            ->firstOrFail();
    }
}
