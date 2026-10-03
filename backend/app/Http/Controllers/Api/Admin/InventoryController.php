<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InventoryAdjustRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Support\Media;
use App\Support\StockLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * GET /api/admin/inventory?stock=in|low|out&q=&category_id=&per_page=
     * Adds meta "summary": product/variant counts, units in stock, low/out counts, stock value.
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['category:id,name', 'primaryImage', 'variants'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('sku', 'like', $term)
                    ->orWhereHas('variants', fn ($v) => $v->where('sku', 'like', $term)));
            })
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->input('stock') === 'in', fn ($q) => $q->whereColumn('stock', '>', 'low_stock_threshold'))
            ->when($request->input('stock') === 'low', fn ($q) => $q->whereColumn('stock', '<=', 'low_stock_threshold')->where('stock', '>', 0))
            ->when($request->input('stock') === 'out', fn ($q) => $q->where('stock', 0))
            ->orderBy('stock')
            ->orderBy('name')
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
                'color_hex' => $v->color_hex,
                'sku' => $v->sku,
                'stock' => $v->stock,
            ]),
        ]);

        $summary = Product::query()->toBase()->selectRaw('
            COUNT(*) as products,
            COALESCE(SUM(stock), 0) as units,
            SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
            SUM(CASE WHEN stock > 0 AND stock <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock,
            COALESCE(SUM(stock * COALESCE(cost, price)), 0) as stock_value
        ')->first();

        return response()->json([
            ...$products->toArray(),
            'summary' => [
                'products' => (int) $summary->products,
                'variants' => ProductVariant::count(),
                'units' => (int) $summary->units,
                'low_stock' => (int) $summary->low_stock,
                'out_of_stock' => (int) $summary->out_of_stock,
                'stock_value' => round((float) $summary->stock_value, 2),
            ],
        ]);
    }

    /**
     * GET /api/admin/inventory/movements?product_id=&per_page= — the stock movement log, newest first.
     */
    public function movements(Request $request): JsonResponse
    {
        $movements = StockMovement::query()
            ->with(['product:id,name', 'variant:id,name', 'user:id,name'])
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->integer('product_id')))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 15), 100))
            ->withQueryString();

        $movements->getCollection()->transform(fn (StockMovement $m) => [
            'id' => $m->id,
            'product' => $m->product?->name,
            'product_id' => $m->product_id,
            'variant' => $m->variant?->name,
            'change' => $m->change,
            'stock_after' => $m->stock_after,
            'type' => $m->type,
            'reason' => $m->reason,
            'reference' => $m->reference,
            'by' => $m->user?->name,
            'created_at' => $m->created_at?->toIso8601String(),
        ]);

        return response()->json($movements);
    }

    /**
     * POST /api/admin/inventory/adjust
     * {"product_id": 1, "variant_id": null, "type": "set|add|subtract", "quantity": 10, "reason": "Restock"}
     *
     * Products with colour variants keep stock = sum of their variants, so adjust a variant for those.
     */
    public function adjust(InventoryAdjustRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = DB::transaction(function () use ($data, $request) {
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

            StockLedger::record($product->id, $variant?->id, $delta, $new, 'adjustment', $data['reason'] ?? null, null, $request->user()->id);

            return ['product' => $product, 'variant' => $variant, 'before' => $current, 'after' => $new, 'delta' => $delta];
        });

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
