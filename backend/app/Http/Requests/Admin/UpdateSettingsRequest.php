<?php

namespace App\Http\Requests\Admin;

/**
 * { "settings": { "delivery": {"inside_dhaka": 60, ...}, "store": {...}, "sms_templates": {...} } }
 */
class UpdateSettingsRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array', 'min:1'],
            'settings.delivery' => ['sometimes', 'array'],
            'settings.delivery.inside_dhaka' => ['sometimes', 'numeric', 'min:0'],
            'settings.delivery.outside_dhaka' => ['sometimes', 'numeric', 'min:0'],
            'settings.delivery.free_delivery_threshold' => ['sometimes', 'numeric', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach (array_keys((array) $this->input('settings', [])) as $key) {
                if (! is_string($key) || ! preg_match('/^[a-z0-9_.]{1,100}$/', $key)) {
                    $validator->errors()->add('settings', "Invalid setting key \"{$key}\".");
                }
            }
        });
    }
}
