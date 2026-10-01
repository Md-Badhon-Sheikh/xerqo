<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    /**
     * GET /api/admin/inventory?stock=low|out&q=&per_page=
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['category:id,name', 'primaryImage', 'variants'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('sku', 'like', $term));
            })
            ->when($request->input('stock') === 'low', fn ($q) => $q->whereColumn('stock', '<=', 'low_stock_threshold')->where('stock', '>', 0))
            ->when($request->input('stock') === 'out', fn ($q) => $q->where('stock', 0))
            ->orderBy('stock')
            ->paginate(min($request->integer('per_page', 30), 100))
            ->withQueryString();

        $products->getCollection()->transform(fn (Product $p) => [
            'id' => $p->id,
            'name' => $p->name,
            'sku' => $p->sku,
            'category' => $p->category?->name,
            'image' => Media::url($p->primaryImage?->path),
            'status' => $p->status,
            'stock' => $p->stock,
            'low_stock_threshold' => $p->low_stock_threshold,
            'stock_status' => $p->stock === 0 ? 'out_of_stock' : ($p->isLowStock() ? 'low_stock' : 'in_stock'),
            'stock_value' => round($p->stock * (float) ($p->cost ?? $p->price), 2),
            'variants' => $p->variants->map(fn (ProductVariant $v) => [
                'id' => $v->id,
                'name' => $v->name,
                'sku' => $v->sku,
                'stock' => $v->stock,
            ]),
        ]);

        return response()->json($products);
    }

    /**
     * POST /api/admin/inventory/adjust {"product_id":1, "variant_id":null, "type":"add|subtract|set", "quantity":5, "reason":"Restock"}
     *
     * Variant adjustments also move the product's total stock by the same delta.
     */
    public function adjust(InventoryAdjustRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = DB::transaction(function () use ($data) {
            $product = Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();
            $variant = ! empty($data['variant_id'])
                ? ProductVariant::whereKey($data['variant_id'])->lockForUpdate()->firstOrFail()
                : null;

            $current = $variant ? $variant->stock : $product->stock;
            $new = match ($data['type']) {
                'set' => $data['quantity'],
                'add' => $current + $data['quantity'],
                'subtract' => max(0, $current - $data['quantity']),
            };
            $delta = $new - $current;

            if ($variant) {
                $variant->update(['stock' => $new]);
                $product->update(['stock' => max(0, $product->stock + $delta)]);
            } else {
                $product->update(['stock' => $new]);
            }

            return ['product' => $product, 'variant' => $variant, 'before' => $current, 'after' => $new, 'delta' => $delta];
        });

        Log::info('[Inventory] stock adjusted', [
            'product_id' => $data['product_id'],
            'variant_id' => $data['variant_id'] ?? null,
            'type' => $data['type'],
            'quantity' => $data['quantity'],
            'before' => $result['before'],
            'after' => $result['after'],
            'reason' => $data['reason'] ?? null,
            'by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Stock updated.',
            'data' => [
                'product_id' => $result['product']->id,
                'product_stock' => $result['product']->stock,
                'variant_id' => $result['variant']?->id,
                'variant_stock' => $result['variant']?->stock,
                'before' => $result['before'],
                'after' => $result['after'],
                'delta' => $result['delta'],
            ],
        ]);
    }
}
