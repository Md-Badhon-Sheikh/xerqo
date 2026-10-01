<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /**
     * GET /api/categories — active top-level categories with their children and product counts.
     */
    public function index(): AnonymousResourceCollection
    {
        $countActive = ['products' => fn ($q) => $q->where('status', 'active')];

        $categories = Category::active()
            ->whereNull('parent_id')
            ->withCount($countActive)
            ->with(['children' => fn ($q) => $q->active()->withCount($countActive)])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }
}
