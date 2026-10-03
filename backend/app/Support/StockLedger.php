<?php

namespace App\Support;

use App\Models\StockMovement;

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
    }
}
