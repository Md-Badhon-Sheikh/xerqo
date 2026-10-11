<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Http\Response;

/**
 * Serves the React app's index.html with the favicon, title, description and share image from Settings.
 *
 * Link-preview crawlers (Facebook, WhatsApp, X…) don't run JavaScript, so these tags must already be
 * in the HTML. On the live site public_path() is public_html, where the React build's index.html lives.
 */
class SiteShell
{
    private const MIME = ['ico' => 'image/x-icon', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp'];

    public static function exists(): bool
    {
        return is_file(public_path('index.html'));
    }

    public static function response(): Response
    {
        return response(self::render(file_get_contents(public_path('index.html'))), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-cache, must-revalidate',
        ]);
    }

    public static function render(string $html): string
    {
        $seo = (array) Setting::getValue('seo', []);

        if ($title = trim((string) ($seo['meta_title'] ?? ''))) {
            $html = preg_replace_callback('#<title>.*?</title>#s', fn () => '<title>'.e($title).'</title>', $html, 1);
            $html = self::meta($html, 'og:title', $title);
            $html = self::meta($html, 'twitter:title', $title);
        }

        if ($description = trim((string) ($seo['meta_description'] ?? ''))) {
            foreach (['description', 'og:description', 'twitter:description'] as $name) {
                $html = self::meta($html, $name, $description);
            }
        }

        if ($favicon = Setting::getValue('store.favicon')) {
            $tag = '<link rel="icon" type="'.self::mime($favicon).'" href="'.e(self::absolute($favicon)).'" />';
            $html = self::replaceOrInsert($html, '#<link\s[^>]*rel="(?:shortcut )?icon"[^>]*>#i', $tag);
        }

        if ($image = $seo['og_image'] ?? null) {
            $url = self::absolute($image);
            foreach (['og:image', 'og:image:secure_url', 'twitter:image'] as $name) {
                $html = self::meta($html, $name, $url);
            }
            $html = self::meta($html, 'og:image:type', self::mime($image));
            foreach (['width', 'height'] as $side) {
                if (! empty($seo["og_image_{$side}"])) {
                    $html = self::meta($html, "og:image:{$side}", (string) $seo["og_image_{$side}"]);
                }
            }
        }

        return $html;
    }

    public static function mime(string $path): string
    {
        return self::MIME[strtolower(pathinfo($path, PATHINFO_EXTENSION))] ?? 'image/png';
    }

    // share images must be absolute URLs
    private static function absolute(string $path): string
    {
        $url = Media::url($path);

        return preg_match('#^https?://#i', $url) ? $url : url($url);
    }

    private static function meta(string $html, string $name, string $content): string
    {
        $attr = str_starts_with($name, 'og:') ? 'property' : 'name';

        return self::replaceOrInsert(
            $html,
            '#<meta\s[^>]*(?:property|name)="'.preg_quote($name, '#').'"[^>]*>#i',
            '<meta '.$attr.'="'.$name.'" content="'.e($content).'" />',
        );
    }

    private static function replaceOrInsert(string $html, string $pattern, string $tag): string
    {
        if (preg_match($pattern, $html)) {
            return preg_replace_callback($pattern, fn () => $tag, $html, 1);
        }

        return preg_replace_callback('#</head>#i', fn ($m) => "  {$tag}\n  {$m[0]}", $html, 1);
    }
}
