<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BannerRequest;
use App\Http\Resources\BannerResource;
use App\Models\Banner;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BannerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $banners = Banner::query()
            ->when($request->filled('position'), fn ($q) => $q->where('position', (string) $request->input('position')))
            ->orderBy('position')
            ->orderBy('sort_order')
            ->get();

        return BannerResource::collection($banners);
    }

    public function store(BannerRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['image', 'image_url']);
        $data['image'] = $request->hasFile('image')
            ? Media::store($request->file('image'), 'banners')
            : $request->validated('image_url');

        $banner = Banner::create($data);

        return (new BannerResource($banner))->response()->setStatusCode(201);
    }

    public function show(Banner $banner): BannerResource
    {
        return new BannerResource($banner);
    }

    public function update(BannerRequest $request, Banner $banner): BannerResource
    {
        $data = $request->safe()->except(['image', 'image_url']);

        if ($request->hasFile('image')) {
            Media::delete($banner->image);
            $data['image'] = Media::store($request->file('image'), 'banners');
        } elseif ($request->filled('image_url')) {
            Media::delete($banner->image);
            $data['image'] = $request->validated('image_url');
        }

        $banner->update($data);

        return new BannerResource($banner);
    }

    public function destroy(Banner $banner): JsonResponse
    {
        Media::delete($banner->image);
        $banner->delete();

        return response()->json(['message' => 'Banner deleted.']);
    }
}
