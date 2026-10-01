<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class Media
{
    /**
     * Public URL for a stored path.
     *
     * Seeded paths such as "/images/fb-wallet.jpg" point at the React app's public folder and are
     * returned untouched; uploaded files live on the "public" disk (storage/app/public).
     */
    public static function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, '/') || preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }

    /**
     * @param  array<int, string>|null  $paths
     * @return array<int, string>
     */
    public static function urls(?array $paths): array
    {
        return array_values(array_filter(array_map(fn ($path) => self::url($path), $paths ?? [])));
    }

    public static function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, 'public');
    }

    /**
     * Delete an uploaded file from the public disk (seeded "/images/..." paths are ignored).
     */
    public static function delete(?string $path): void
    {
        if ($path && ! str_starts_with($path, '/') && ! preg_match('#^https?://#i', $path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
