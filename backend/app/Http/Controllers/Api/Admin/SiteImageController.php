<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The favicon (Settings → Store) and the link-preview image (Settings → SEO).
 * Both are stored inside their settings object; SiteShell puts them into the page HTML.
 */
class SiteImageController extends Controller
{
    // slot => [setting key, field]
    private const SLOTS = [
        'favicon' => ['store', 'favicon'],
        'og-image' => ['seo', 'og_image'],
    ];

    /**
     * POST /api/admin/settings/images/{favicon|og-image}  (multipart: image)
     */
    public function store(Request $request, string $slot): JsonResponse
    {
        [$key, $field] = self::SLOTS[$slot] ?? abort(404);

        $request->validate(['image' => $slot === 'favicon'
            ? ['required', 'file', 'mimes:png,ico,jpg,jpeg,webp', 'max:1024']
            : ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'dimensions:min_width=600,min_height=315'],
        ], [
            'image.dimensions' => 'The share image should be at least 600×315 pixels (1200×630 is best).',
        ]);

        $file = $request->file('image');
        $path = Media::store($file, 'site');

        $value = $this->current($key);
        Media::delete($value[$field] ?? null);
        $value[$field] = $path;

        if ($slot === 'og-image') {
            [$value['og_image_width'], $value['og_image_height']] = getimagesize($file->getRealPath()) ?: [null, null];
        }

        Setting::setValue($key, $value);

        return response()->json(['data' => ['url' => Media::url($path)]]);
    }

    /**
     * DELETE /api/admin/settings/images/{favicon|og-image} — back to the default from the website build.
     */
    public function destroy(string $slot): JsonResponse
    {
        [$key, $field] = self::SLOTS[$slot] ?? abort(404);

        $value = $this->current($key);
        Media::delete($value[$field] ?? null);
        unset($value[$field], $value["{$field}_width"], $value["{$field}_height"]);

        Setting::setValue($key, $value);

        return response()->json(['data' => ['url' => null]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function current(string $key): array
    {
        $setting = Setting::firstOrCreate(['key' => $key], ['value' => [], 'group' => 'general', 'is_public' => true]);

        return (array) $setting->value;
    }
}
