<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->withCount('products')
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.trim((string) $request->input('q')).'%'))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            $data['image'] = Media::store($request->file('image'), 'categories');
        }

        $category = Category::create($data);

        return (new CategoryResource($category->loadCount('products')))->response()->setStatusCode(201);
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('children')->loadCount('products'));
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            Media::delete($category->image);
            $data['image'] = Media::store($request->file('image'), 'categories');
        }

        $category->update($data);

        return new CategoryResource($category->loadCount('products'));
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'Move or delete the products in this category first.',
            ]);
        }

        Media::delete($category->image);
        $category->delete(); // sub-categories become top-level (parent_id nullOnDelete)

        return response()->json(['message' => 'Category deleted.']);
    }
}
