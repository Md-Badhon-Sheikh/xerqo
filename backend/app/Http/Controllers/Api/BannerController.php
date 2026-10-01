<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BannerResource;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BannerController extends Controller
{
    /**
     * GET /api/banners?position=home_hero
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $banners = Banner::live()
            ->when($request->filled('position'), fn ($q) => $q->where('position', (string) $request->input('position')))
            ->orderBy('position')
            ->orderBy('sort_order')
            ->get();

        return BannerResource::collection($banners);
    }
}
