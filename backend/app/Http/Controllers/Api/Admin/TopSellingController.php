<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Setting;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin → Top Selling: the "Top Selling Products" section on the homepage.
 * Picked products show in the chosen order; with none picked the section shows the best sellers automatically.
 */
class TopSellingController extends Controller
{
    public const MAX = 12;

    /**
     * GET /api/admin/top-selling
     */
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->payload()]);
    }

    /**
     * PUT /api/admin/top-selling {"enabled", "eyebrow", "title", "product_ids": [5, 2, 9]}
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'eyebrow' => ['nullable', 'string', 'max:40'],
            'title' => ['required', 'string', 'max:80'],
            'product_ids' => ['present', 'array', 'max:'.self::MAX],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ], [
            'product_ids.max' => 'Pick at most '.self::MAX.' products.',
        ]);

        Setting::setValue('top_selling', [
            'enabled' => (bool) $data['enabled'],
            'eyebrow' => $data['eyebrow'] ?? null,
            'title' => $data['title'],
            'product_ids' => array_values(array_map('intval', $data['product_ids'])),
        ], 'content', true);

        return response()->json(['data' => $this->payload()]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        $value = (array) Setting::getValue('top_selling', []);
        $ids = collect($value['product_ids'] ?? []);
        $products = Product::with('primaryImage')->whereIn('id', $ids)->get()->keyBy('id');

        return [
            'enabled' => (bool) ($value['enabled'] ?? true),
            'eyebrow' => $value['eyebrow'] ?? null,
            'title' => $value['title'] ?? 'Top Selling Products',
            'products' => $ids->filter(fn ($id) => $products->has($id))->map(fn ($id) => [
                'id' => $id,
                'name' => $products[$id]->name,
                'sku' => $products[$id]->sku,
                'price' => $products[$id]->price,
                'status' => $products[$id]->status,
                'image' => Media::url($products[$id]->primaryImage?->path),
            ])->values(),
            'max' => self::MAX,
        ];
    }
}
