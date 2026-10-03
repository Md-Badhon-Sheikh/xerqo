<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingController extends Controller
{
    /**
     * GET /api/admin/settings — every setting as {key: value}, plus group/visibility metadata.
     */
    /**
     * PUT /api/admin/content/announcement — the strip above the storefront header.
     * Lives under the "content" permission so content editors can change it without full settings access.
     */
    public function announcement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'text' => ['required', 'string', 'max:200'],
            'mobile_text' => ['nullable', 'string', 'max:80'],
            'link_text' => ['nullable', 'string', 'max:40'],
            'link' => ['nullable', 'string', 'max:255'],
        ]);

        Setting::setValue('announcement', $data, 'content', true);

        return response()->json(['data' => Setting::getValue('announcement')]);
    }

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
