<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\OrderStatusService;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Manual payments (bKash / Rocket / Nagad transaction ids, bank deposit slips) waiting for staff to check.
 */
class PaymentController extends Controller
{
    /**
     * GET /api/admin/payments?status=pending|verified|rejected&method=&q=
     * meta "summary": counts per status + amount waiting for verification.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'verified', 'rejected'])],
            'method' => ['nullable', Rule::in(Order::PAYMENT_METHODS)],
        ]);

        $payments = Payment::query()
            ->with(['order', 'verifier:id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('method'), fn ($q) => $q->where('method', $request->input('method')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('transaction_id', 'like', $term)
                    ->orWhere('sender_number', 'like', $term)
                    ->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', $term)->orWhere('phone', 'like', $term)));
            })
            // oldest pending first — that's the queue to work through
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('created_at', $request->input('status') === 'pending' ? 'asc' : 'desc')
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        $counts = Payment::query()->selectRaw('status, COUNT(*) as total, SUM(amount) as amount')->groupBy('status')->get()->keyBy('status');

        return PaymentResource::collection($payments)->additional([
            'summary' => [
                'pending' => (int) ($counts['pending']->total ?? 0),
                'pending_amount' => round((float) ($counts['pending']->amount ?? 0), 2),
                'verified' => (int) ($counts['verified']->total ?? 0),
                'verified_amount' => round((float) ($counts['verified']->amount ?? 0), 2),
                'rejected' => (int) ($counts['rejected']->total ?? 0),
            ],
        ]);
    }

    /**
     * PATCH /api/admin/payments/{id}/verify {"note": "…"}
     * Marks the order paid; a pending order is confirmed at the same time.
     */
    public function verify(Request $request, Payment $payment, OrderStatusService $statuses, SmsService $sms): PaymentResource
    {
        $data = $request->validate(['note' => ['nullable', 'string', 'max:500']]);
        $this->assertPending($payment);

        DB::transaction(function () use ($payment, $data, $request, $statuses) {
            $payment->update([
                'status' => Payment::STATUS_VERIFIED,
                'admin_note' => $data['note'] ?? null,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);
            $order = $payment->order;
            $order->update(['payment_status' => 'paid', 'transaction_id' => $payment->transaction_id ?? $order->transaction_id]);

            if ($order->status === 'pending') {
                $statuses->transition($order, 'confirmed', 'Payment verified', $request->user());
            }
        });

        $order = $payment->order->refresh();
        $sms->sendTemplate($order->phone, 'payment_verified', [
            'name' => $order->name,
            'order_id' => $order->order_number,
            'amount' => number_format($payment->amount),
        ]);

        return new PaymentResource($payment->refresh()->load(['order', 'verifier:id,name']));
    }

    /**
     * PATCH /api/admin/payments/{id}/reject {"note": "Transaction id not found"}
     * The customer is told why and can send the payment details again.
     */
    public function reject(Request $request, Payment $payment, SmsService $sms): PaymentResource
    {
        $data = $request->validate(['note' => ['required', 'string', 'max:500']], ['note.required' => 'Tell the customer why the payment was rejected.']);
        $this->assertPending($payment);

        DB::transaction(function () use ($payment, $data, $request) {
            $payment->update([
                'status' => Payment::STATUS_REJECTED,
                'admin_note' => $data['note'],
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
            ]);
            $payment->order->update(['payment_status' => 'failed']);
            $payment->order->statusHistories()->create([
                'status' => $payment->order->status,
                'note' => 'Payment rejected: '.$data['note'],
                'changed_by' => $request->user()->id,
            ]);
        });

        $order = $payment->order->refresh();
        $sms->sendTemplate($order->phone, 'payment_rejected', [
            'name' => $order->name,
            'order_id' => $order->order_number,
            'reason' => $data['note'],
            'tracking_link' => rtrim((string) config('app.frontend_url'), '/').'/track?order='.$order->order_number,
        ]);

        return new PaymentResource($payment->refresh()->load(['order', 'verifier:id,name']));
    }

    private function assertPending(Payment $payment): void
    {
        if ($payment->status !== Payment::STATUS_PENDING) {
            throw ValidationException::withMessages(['payment' => "This payment was already {$payment->status}."]);
        }
    }
}
