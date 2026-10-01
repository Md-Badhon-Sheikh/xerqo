<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json:unicode',
            'is_public' => 'boolean',
        ];
    }

    /**
     * Per-request cache of key => value.
     *
     * @var array<string, mixed>|null
     */
    protected static ?array $loaded = null;

    protected static function booted(): void
    {
        static::saved(fn () => static::flushCache());
        static::deleted(fn () => static::flushCache());
    }

    /**
     * Read a setting; dot notation reaches into JSON values, e.g. Setting::getValue('delivery.inside_dhaka', 60).
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        if (static::$loaded === null) {
            static::$loaded = static::query()->pluck('value', 'key')->all();
        }

        return data_get(static::$loaded, $key, $default);
    }

    public static function setValue(string $key, mixed $value, ?string $group = null, ?bool $isPublic = null): self
    {
        $setting = static::firstOrNew(['key' => $key]);
        $setting->value = $value;

        if ($group !== null) {
            $setting->group = $group;
        }

        if ($isPublic !== null) {
            $setting->is_public = $isPublic;
        }

        $setting->save();

        return $setting;
    }

    public static function flushCache(): void
    {
        static::$loaded = null;
    }
}
