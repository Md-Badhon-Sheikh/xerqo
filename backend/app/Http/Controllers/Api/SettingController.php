<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /**
     * GET /api/settings — public storefront settings (store info, delivery charges, payment options).
     */
    public function index(): JsonResponse
    {
        $settings = Setting::where('is_public', true)->get()->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }
}
