<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    /**
     * GET /api/admin/settings — every setting as {key: value}, plus group/visibility metadata.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get();

        return response()->json([
            'data' => $settings->pluck('value', 'key'),
            'meta' => $settings->map(fn (Setting $s) => [
                'key' => $s->key,
                'group' => $s->group,
                'is_public' => $s->is_public,
                'updated_at' => $s->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /**
     * PUT /api/admin/settings {"settings": {"delivery": {...}, "sms_templates": {...}}}
     *
     * Object values are merged into the existing value, so partial updates are safe.
     */
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $incoming = (array) $request->input('settings', []);

        DB::transaction(function () use ($incoming) {
            foreach ($incoming as $key => $value) {
                $setting = Setting::firstOrNew(['key' => $key]);
                $current = $setting->exists ? $setting->value : null;

                $setting->value = is_array($current) && is_array($value) && ! array_is_list($value)
                    ? array_replace_recursive($current, $value)
                    : $value;

                if (! $setting->exists) {
                    $setting->group = 'general';
                    $setting->is_public = false;
                }

                $setting->save();
            }
        });

        return $this->index();
    }
}
