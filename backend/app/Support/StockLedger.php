<?php

namespace App\Support;

use App\Models\Product;
use App\Models\StockMovement;
use App\Services\AdminNotifier;

/**
 * Records stock changes in stock_movements (the inventory "movement log").
 * Call after the stock column has been updated; zero changes are ignored.
 */
class StockLedger
{
    public static function record(
        int $productId,
        ?int $variantId,
        int $change,
        int $stockAfter,
        string $type,
        ?string $reason = null,
        ?string $reference = null,
        ?int $userId = null,
    ): void {
        if ($change === 0) {
            return;
        }

        StockMovement::create([
            'product_id' => $productId,
            'variant_id' => $variantId,
            'change' => $change,
            'stock_after' => $stockAfter,
            'type' => $type,
            'reason' => $reason,
            'reference' => $reference,
            'user_id' => $userId ?? auth()->id(),
        ]);

        if ($change < 0) {
            self::alertIfLow($productId, $change);
        }
    }

    /**
     * Tell inventory staff once, when a product's total stock drops to its low-stock level.
     */
    private static function alertIfLow(int $productId, int $change): void
    {
        $product = Product::find($productId);
        if (! $product || $product->status === 'draft') {
            return;
        }

        $before = $product->stock - $change;
        if ($product->stock <= $product->low_stock_threshold && $before > $product->low_stock_threshold) {
            app(AdminNotifier::class)->notify(
                'low_stock',
                ($product->stock === 0 ? 'Out of stock: ' : 'Low stock: ').$product->name,
                "{$product->stock} left · alert level {$product->low_stock_threshold}",
                '/admin/inventory?stock=low',
            );
        }
    }
}
