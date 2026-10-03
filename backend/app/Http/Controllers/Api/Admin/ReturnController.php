<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateReturnRequest;
use App\Http\Resources\ReturnRequestResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Services\SmsService;
use App\Support\StockLedger;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    /**
     * GET /api/admin/returns?status=pending
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $returns = ReturnRequest::query()
            ->with(['order:id,order_number,name,phone', 'orderItem'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        $counts = ReturnRequest::query()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        return ReturnRequestResource::collection($returns)->additional([
            'counts' => [
                'all' => (int) $counts->sum(),
                ...collect(ReturnRequest::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($counts[$s] ?? 0)])->all(),
            ],
            'refunded_this_month' => round((float) ReturnRequest::where('status', 'completed')->where('resolution', 'refund')
                ->where('resolved_at', '>=', now()->startOfMonth())->sum('amount'), 2),
        ]);
    }

    public function show(ReturnRequest $return): ReturnRequestResource
    {
        return new ReturnRequestResource($return->load(['order', 'orderItem']));
    }

    /**
     * PUT/PATCH /api/admin/returns/{id} {"status": "approved|rejected|received|completed", "amount": 1450, "admin_note": "...", "restock": true}
     */
    public function update(UpdateReturnRequest $request, ReturnRequest $return, SmsService $sms): ReturnRequestResource
    {
        $data = $request->validated();
        $previous = $return->status;

        DB::transaction(function () use ($data, $return, $request, $previous) {
            $attributes = collect($data)->only(['status', 'resolution', 'amount', 'admin_note'])->all();

            if (isset($data['status']) && in_array($data['status'], ['rejected', 'completed'], true)) {
                $attributes['resolved_at'] = now();
            }

            $return->update($attributes);

            // Put items back into stock once, when the parcel arrives back at the warehouse.
            $justReceived = ($data['status'] ?? null) === 'received' && $previous !== 'received';
            if ($justReceived && $request->boolean('restock', true)) {
                $item = $return->orderItem;

                if ($item?->variant_id) {
                    ProductVariant::whereKey($item->variant_id)->increment('stock', $return->qty);
                }

                if ($item?->product_id) {
                    Product::whereKey($item->product_id)->increment('stock', $return->qty);

                    $after = $item->variant_id
                        ? (int) ProductVariant::whereKey($item->variant_id)->value('stock')
                        : (int) Product::whereKey($item->product_id)->value('stock');
                    StockLedger::record($item->product_id, $item->variant_id, $return->qty, $after, 'return', 'Return received', 'RT-'.$return->id);
                }
            }

            // Fully refunded order → mark payment refunded.
            if (($data['status'] ?? null) === 'completed' && $return->resolution === 'refund') {
                $order = $return->order;
                $refunded = $order->returnRequests()->where('status', 'completed')->where('resolution', 'refund')->sum('amount');

                if ($refunded >= $order->total - $order->delivery_charge) {
                    $order->update(['payment_status' => 'refunded']);
                }
            }
        });

        if (($data['status'] ?? null) === 'approved' && $previous !== 'approved') {
            $sms->sendTemplate($return->order->phone, 'return_approved', [
                'name' => $return->order->name,
                'return_id' => 'R-'.$return->id,
                'order_id' => $return->order->order_number,
                'date' => now()->addDay()->format('j M'),
            ]);
        }

        return new ReturnRequestResource($return->fresh(['order', 'orderItem']));
    }
}
