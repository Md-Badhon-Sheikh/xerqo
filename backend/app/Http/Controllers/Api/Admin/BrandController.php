<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BrandController extends Controller
{
    /**
     * GET /api/admin/brands?q=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $brands = Brand::query()
            ->withCount('products')
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.trim((string) $request->input('q')).'%'))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return BrandResource::collection($brands);
    }

    /**
     * POST /api/admin/brands (multipart when uploading "logo")
     */
    public function store(BrandRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['logo', 'remove_logo']);

        if ($request->hasFile('logo')) {
            $data['logo'] = Media::store($request->file('logo'), 'brands');
        }

        $brand = Brand::create($data)->refresh(); // refresh: load DB defaults (is_active, sort_order)

        return (new BrandResource($brand->loadCount('products')))->response()->setStatusCode(201);
    }

    public function show(Brand $brand): BrandResource
    {
        return new BrandResource($brand->loadCount('products'));
    }

    /**
     * PUT /api/admin/brands/{id} (POST + _method=PUT for multipart)
     */
    public function update(BrandRequest $request, Brand $brand): BrandResource
    {
        $data = $request->safe()->except(['logo', 'remove_logo']);

        if ($request->hasFile('logo')) {
            Media::delete($brand->logo);
            $data['logo'] = Media::store($request->file('logo'), 'brands');
        } elseif ($request->boolean('remove_logo')) {
            Media::delete($brand->logo);
            $data['logo'] = null;
        }

        $brand->update($data);

        return new BrandResource($brand->loadCount('products'));
    }

    /**
     * DELETE /api/admin/brands/{id} — its products stay, just without a brand.
     */
    public function destroy(Brand $brand): JsonResponse
    {
        Media::delete($brand->logo);
        $brand->delete();

        return response()->json(['message' => 'Brand deleted.']);
    }
}
