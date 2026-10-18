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

    /**
     * PUT /api/admin/content/testimonials — the "What our customers say" section on the homepage.
     */
    public function testimonials(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'eyebrow' => ['nullable', 'string', 'max:40'],
            'title' => ['required', 'string', 'max:80'],
            'count' => ['required', 'integer', 'between:1,9'],
            'source' => ['required', 'in:auto,featured'],
            'min_rating' => ['required', 'integer', 'between:1,5'],
        ]);

        Setting::setValue('testimonials', $data, 'content', true);

        return response()->json(['data' => Setting::getValue('testimonials')]);
    }

    /**
     * PUT /api/admin/content/highlights — the numbered strip under "Featured categories" on the homepage.
     */
    public function highlights(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'items' => ['required', 'array', 'min:1', 'max:4'],
            'items.*.title' => ['required', 'string', 'max:40'],
            'items.*.subtitle' => ['nullable', 'string', 'max:60'],
        ], [
            'items.*.title.required' => 'Enter a title.',
        ]);

        $data['items'] = array_map(fn ($item) => [
            'title' => trim($item['title']),
            'subtitle' => trim((string) ($item['subtitle'] ?? '')) ?: null,
        ], array_values($data['items']));

        Setting::setValue('highlights', $data, 'content', true);

        return response()->json(['data' => Setting::getValue('highlights')]);
    }

    public function index(): JsonResponse
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get();

        return response()->json([
            'data' => Setting::withImageUrls($settings->pluck('value', 'key')->all()),
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

                $setting->value = is_array($current) && is_array($value) ? self::merge($current, $value) : $value;

                if (! $setting->exists) {
                    $setting->group = 'general';
                    $setting->is_public = in_array($key, self::PUBLIC_KEYS, true);
                }

                $setting->save();
            }
        });

        return $this->index();
    }

    // settings the storefront reads through GET /api/settings
    private const PUBLIC_KEYS = ['store', 'delivery', 'payments', 'returns', 'engraving', 'auth', 'announcement', 'highlights', 'testimonials', 'craft_story', 'top_selling', 'about', 'contact_page', 'footer', 'seo', 'maintenance'];

    /**
     * Objects merge key by key; lists (e.g. the courier names) are replaced as a whole.
     *
     * @param  array<mixed>  $current
     * @param  array<mixed>  $incoming
     * @return array<mixed>
     */
    private static function merge(array $current, array $incoming): array
    {
        if (array_is_list($incoming) || array_is_list($current) && $current !== []) {
            return $incoming;
        }

        foreach ($incoming as $k => $v) {
            $current[$k] = is_array($v) && is_array($current[$k] ?? null) ? self::merge($current[$k], $v) : $v;
        }

        return $current;
    }
}
