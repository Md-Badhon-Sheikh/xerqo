<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\FlashSaleRequest;
use App\Models\FlashSale;
use App\Models\FlashSaleItem;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FlashSaleController extends Controller
{
    /**
     * GET /api/admin/flash-sales — newest first, each with status live | scheduled | ended | disabled.
     */
    public function index(): JsonResponse
    {
        $sales = FlashSale::withCount('items')->orderByDesc('starts_at')->get();

        return response()->json(['data' => $sales->map(fn (FlashSale $s) => $this->summary($s))]);
    }

    public function show(FlashSale $flashSale): JsonResponse
    {
        return response()->json(['data' => $this->detail($flashSale)]);
    }

    public function store(FlashSaleRequest $request): JsonResponse
    {
        $sale = DB::transaction(function () use ($request) {
            $sale = FlashSale::create($request->safe()->except('items'))->refresh(); // refresh: load DB defaults (is_active)
            $this->syncItems($sale, $request->validated('items'));

            return $sale;
        });

        return response()->json(['data' => $this->detail($sale)], 201);
    }

    public function update(FlashSaleRequest $request, FlashSale $flashSale): JsonResponse
    {
        DB::transaction(function () use ($request, $flashSale) {
            $flashSale->update($request->safe()->except('items'));

            if ($request->has('items')) {
                $this->syncItems($flashSale, $request->validated('items'));
            }
        });

        return response()->json(['data' => $this->detail($flashSale->refresh())]);
    }

    public function destroy(FlashSale $flashSale): JsonResponse
    {
        $flashSale->delete();

        return response()->json(['message' => 'Flash sale deleted.']);
    }

    /**
     * @param  array<int, array{product_id: int, sale_price: float}>  $items
     */
    private function syncItems(FlashSale $sale, array $items): void
    {
        $sale->items()->delete();

        foreach (array_values($items) as $position => $item) {
            $sale->items()->create([
                'product_id' => $item['product_id'],
                'sale_price' => $item['sale_price'],
                'sort_order' => $position,
            ]);
        }
    }

    private function status(FlashSale $sale): string
    {
        return match (true) {
            ! $sale->is_active => 'disabled',
            $sale->ends_at->isPast() => 'ended',
            $sale->starts_at->isFuture() => 'scheduled',
            default => 'live',
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(FlashSale $sale): array
    {
        return [
            'id' => $sale->id,
            'title' => $sale->title,
            'starts_at' => $sale->starts_at->toIso8601String(),
            'ends_at' => $sale->ends_at->toIso8601String(),
            'is_active' => $sale->is_active,
            'status' => $this->status($sale),
            'items_count' => (int) ($sale->items_count ?? $sale->items()->count()),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function detail(FlashSale $sale): array
    {
        $sale->load(['items.product.primaryImage']);

        return [
            ...$this->summary($sale),
            'items_count' => $sale->items->count(),
            'items' => $sale->items->map(fn (FlashSaleItem $item) => [
                'product_id' => $item->product_id,
                'name' => $item->product?->name,
                'sku' => $item->product?->sku,
                'image' => Media::url($item->product?->primaryImage?->path),
                'price' => $item->product?->price,
                'sale_price' => $item->sale_price,
                'discount_percent' => $item->product?->price > 0
                    ? (int) round((($item->product->price - $item->sale_price) / $item->product->price) * 100)
                    : 0,
            ]),
        ];
    }
}
