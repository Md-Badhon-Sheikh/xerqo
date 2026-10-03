<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WishlistController extends Controller
{
    /**
     * GET /api/me/wishlist
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $request->user()->wishlistProducts()
            ->forCard()
            ->orderByPivot('created_at', 'desc')
            ->get();

        return ProductResource::collection($products);
    }

    /**
     * POST /api/me/wishlist {"product_id": 1}
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $request->user()->wishlistProducts()->syncWithoutDetaching([$data['product_id']]);

        return response()->json(['message' => 'Added to wishlist.', 'product_id' => $data['product_id']], 201);
    }

    /**
     * DELETE /api/me/wishlist/{product}  (product id)
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlistProducts()->detach($product->id);

        return response()->json(['message' => 'Removed from wishlist.']);
    }
}
