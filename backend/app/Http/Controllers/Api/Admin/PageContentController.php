<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

/**
 * Admin → Pages: the About page, the Contact page and the store footer.
 * Each is one public setting; images are uploaded first (uploadImage) and saved as "/storage/content/…" URLs.
 */
class PageContentController extends Controller
{
    private const IMAGE_PREFIX = '/storage/content/';

    // URL path (/admin/content/pages/{page}) => setting key
    private const PAGES = ['about' => 'about', 'contact' => 'contact_page', 'footer' => 'footer'];

    /**
     * PUT /api/admin/content/pages/{about|contact|footer}
     */
    public function update(Request $request, string $page): JsonResponse
    {
        $key = self::PAGES[$page] ?? abort(404);
        $data = $request->validate($this->rules($page), [
            '*.required' => 'Required.',
            '*.required_if_accepted' => 'Required while this section is shown.',
            '*.regex' => 'Upload an image or use a link starting with / or https://.',
        ]);

        $old = (array) Setting::getValue($key, []);
        Setting::setValue($key, $data, 'content', true);

        // uploaded images that are no longer used
        $kept = self::uploads($data);
        foreach (array_diff(self::uploads($old), $kept) as $url) {
            Storage::disk('public')->delete(substr($url, strlen('/storage/')));
        }

        return response()->json(['data' => Setting::getValue($key)]);
    }

    /**
     * POST /api/admin/content/images (multipart: image) — returns the URL to put into a page field.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120']]);

        $path = $request->file('image')->store('content', 'public');

        return response()->json(['data' => ['url' => '/storage/'.$path]], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(string $page): array
    {
        $image = ['nullable', 'string', 'max:255', 'regex:#^(/|https?://)#i'];
        $link = ['nullable', 'string', 'max:255'];

        return match ($page) {
            'about' => [
                'hero' => ['required', 'array'],
                'hero.eyebrow' => ['nullable', 'string', 'max:40'],
                'hero.title' => ['required', 'string', 'max:80'],
                'hero.text' => ['nullable', 'string', 'max:400'],
                'hero.image' => $image,
                'values' => ['present', 'array', 'max:4'],
                'values.*.title' => ['required', 'string', 'max:40'],
                'values.*.subtitle' => ['nullable', 'string', 'max:80'],
                'story' => ['present', 'array', 'max:6'],
                'story.*.title' => ['required', 'string', 'max:80'],
                'story.*.text' => ['required', 'string', 'max:600'],
                'story.*.image' => $image,
                'stats' => ['present', 'array', 'max:4'],
                'stats.*.value' => ['required', 'string', 'max:20'],
                'stats.*.label' => ['required', 'string', 'max:40'],
                'cta' => ['required', 'array'],
                'cta.enabled' => ['required', 'boolean'],
                'cta.title' => ['nullable', 'required_if_accepted:cta.enabled', 'string', 'max:80'],
                'cta.button_text' => ['nullable', 'string', 'max:30'],
                'cta.link' => $link,
                'cta.image' => $image,
            ],
            'contact' => [
                'hero' => ['required', 'array'],
                'hero.title' => ['required', 'string', 'max:80'],
                'hero.subtitle' => ['nullable', 'string', 'max:250'],
                'hero.image' => $image,
                'hours' => ['nullable', 'string', 'max:60'],
                'whatsapp_note' => ['nullable', 'string', 'max:60'],
                'email_note' => ['nullable', 'string', 'max:60'],
                'showroom' => ['required', 'array'],
                'showroom.enabled' => ['required', 'boolean'],
                'showroom.area' => ['nullable', 'required_if_accepted:showroom.enabled', 'string', 'max:80'],
                'showroom.note' => ['nullable', 'string', 'max:60'],
                'showroom.map_link' => ['nullable', 'url', 'max:500'],
                'subjects' => ['required', 'array', 'min:1', 'max:10'],
                'subjects.*' => ['required', 'string', 'max:60', 'distinct'],
                'promo' => ['required', 'array'],
                'promo.enabled' => ['required', 'boolean'],
                'promo.eyebrow' => ['nullable', 'string', 'max:40'],
                'promo.text' => ['nullable', 'required_if_accepted:promo.enabled', 'string', 'max:200'],
                'promo.button_text' => ['nullable', 'string', 'max:30'],
                'promo.link' => $link,
                'promo.image' => $image,
            ],
            'footer' => [
                'about' => ['nullable', 'string', 'max:250'],
                'newsletter' => ['required', 'array'],
                'newsletter.enabled' => ['required', 'boolean'],
                'newsletter.title' => ['nullable', 'required_if_accepted:newsletter.enabled', 'string', 'max:60'],
                'newsletter.text' => ['nullable', 'string', 'max:120'],
                'columns' => ['present', 'array', 'max:3'],
                'columns.*.title' => ['required', 'string', 'max:30'],
                'columns.*.links' => ['required', 'array', 'min:1', 'max:10'],
                'columns.*.links.*.label' => ['required', 'string', 'max:40'],
                'columns.*.links.*.link' => ['required', 'string', 'max:255'],
                'copyright' => ['nullable', 'string', 'max:120'],
            ],
        };
    }

    /**
     * Every uploaded-image URL inside a page value.
     *
     * @param  array<mixed>  $value
     * @return array<int, string>
     */
    private static function uploads(array $value): array
    {
        return array_values(array_filter(Arr::flatten($value), fn ($v) => is_string($v) && str_starts_with($v, self::IMAGE_PREFIX)));
    }
}
