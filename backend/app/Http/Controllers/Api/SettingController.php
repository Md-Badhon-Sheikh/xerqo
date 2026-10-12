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
        $settings = Setting::withImageUrls(Setting::where('is_public', true)->get()->pluck('value', 'key')->all());

        // the public OAuth client ID for "Continue with Google" (null = button hidden)
        $settings['auth'] = [...(array) ($settings['auth'] ?? []), 'google_client_id' => config('services.google.client_id') ?: null];

        return response()->json(['data' => $settings]);
    }
}
