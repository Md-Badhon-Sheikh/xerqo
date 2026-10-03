<?php

namespace App\Http\Requests\Admin;

use App\Models\Setting;

/**
 * { "settings": { "delivery": {"inside_dhaka": 60, ...}, "store": {...}, "payments": {...} } }
 *
 * Every known key is validated; partial objects are fine (the controller merges them into the saved value).
 */
class UpdateSettingsRequest extends AdminRequest
{
    private const WALLETS = ['bkash', 'rocket', 'nagad'];

    public function rules(): array
    {
        $rules = [
            'settings' => ['required', 'array', 'min:1'],

            'settings.store' => ['sometimes', 'array'],
            'settings.store.name' => ['sometimes', 'required', 'string', 'max:100'],
            'settings.store.tagline' => ['sometimes', 'nullable', 'string', 'max:150'],
            'settings.store.email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'settings.store.phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'settings.store.whatsapp' => ['sometimes', 'nullable', 'string', 'max:30'],
            'settings.store.address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'settings.store.trade_license' => ['sometimes', 'nullable', 'string', 'max:60'],
            'settings.store.bin' => ['sometimes', 'nullable', 'string', 'max:60'],
            'settings.store.facebook' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.store.instagram' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.store.messenger' => ['sometimes', 'nullable', 'url', 'max:255'],
            'settings.store.show_chat_button' => ['sometimes', 'boolean'],

            'settings.seo' => ['sometimes', 'array'],
            'settings.seo.meta_title' => ['sometimes', 'nullable', 'string', 'max:70'],
            'settings.seo.meta_description' => ['sometimes', 'nullable', 'string', 'max:170'],

            'settings.maintenance' => ['sometimes', 'array'],
            'settings.maintenance.enabled' => ['sometimes', 'boolean'],
            'settings.maintenance.message' => ['sometimes', 'nullable', 'string', 'max:300'],

            'settings.auth' => ['sometimes', 'array'],
            'settings.auth.otp_login' => ['sometimes', 'boolean'],
            'settings.auth.register_otp' => ['sometimes', 'boolean'],

            'settings.returns' => ['sometimes', 'array'],
            'settings.returns.window_days' => ['sometimes', 'integer', 'between:0,60'],
            'settings.returns.policy' => ['sometimes', 'nullable', 'string', 'max:2000'],

            'settings.engraving' => ['sometimes', 'array'],
            'settings.engraving.enabled' => ['sometimes', 'boolean'],
            'settings.engraving.max_length' => ['sometimes', 'integer', 'between:5,60'],
            'settings.engraving.fee' => ['sometimes', 'numeric', 'between:0,5000'],

            'settings.reviews' => ['sometimes', 'array'],
            'settings.reviews.auto_approve' => ['sometimes', 'boolean'],

            'settings.delivery' => ['sometimes', 'array'],
            'settings.delivery.inside_dhaka' => ['sometimes', 'numeric', 'between:0,5000'],
            'settings.delivery.outside_dhaka' => ['sometimes', 'numeric', 'between:0,5000'],
            'settings.delivery.free_delivery_threshold' => ['sometimes', 'numeric', 'between:0,1000000'], // 0 = never free
            'settings.delivery.inside_dhaka_eta' => ['sometimes', 'nullable', 'string', 'max:30'],
            'settings.delivery.outside_dhaka_eta' => ['sometimes', 'nullable', 'string', 'max:30'],
            'settings.delivery.couriers' => ['sometimes', 'array', 'min:1', 'max:15'],
            'settings.delivery.couriers.*' => ['required', 'string', 'max:40', 'distinct:ignore_case'],

            'settings.payments' => ['sometimes', 'array'],
            'settings.payments.cod.enabled' => ['sometimes', 'boolean'],
            'settings.payments.bank.enabled' => ['sometimes', 'boolean'],
            'settings.payments.bank.bank_name' => ['sometimes', 'nullable', 'required_if_accepted:settings.payments.bank.enabled', 'string', 'max:100'],
            'settings.payments.bank.account_name' => ['sometimes', 'nullable', 'required_if_accepted:settings.payments.bank.enabled', 'string', 'max:100'],
            'settings.payments.bank.account_number' => ['sometimes', 'nullable', 'required_if_accepted:settings.payments.bank.enabled', 'string', 'max:40'],
            'settings.payments.bank.branch' => ['sometimes', 'nullable', 'string', 'max:100'],
            'settings.payments.bank.routing_number' => ['sometimes', 'nullable', 'string', 'max:20'],
            'settings.payments.bank.instructions' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];

        foreach (self::WALLETS as $w) {
            $rules["settings.payments.{$w}.enabled"] = ['sometimes', 'boolean'];
            // bKash / Nagad numbers are 11 digits, Rocket accounts 12 (the 11-digit mobile number plus a check digit)
            $rules["settings.payments.{$w}.number"] = ['sometimes', 'nullable', "required_if_accepted:settings.payments.{$w}.enabled", 'regex:/^01[3-9]\d{8,9}$/'];
            $rules["settings.payments.{$w}.account_type"] = ['sometimes', 'in:Merchant,Personal,Agent'];
            $rules["settings.payments.{$w}.instructions"] = ['sometimes', 'nullable', 'string', 'max:500'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'settings.payments.*.number.regex' => 'Enter the wallet number like 01712345678 (Rocket: 12 digits).',
            'settings.payments.*.number.required_if_accepted' => 'Enter the number customers should pay to.',
            'settings.payments.bank.*.required_if_accepted' => 'Required while bank transfer is on.',
            'settings.delivery.couriers.*.distinct' => 'This courier is listed twice.',
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

            // checkout needs at least one way to pay
            $payments = $this->input('settings.payments');
            if (is_array($payments)) {
                $merged = array_replace_recursive((array) Setting::getValue('payments', []), $payments);
                if (! collect($merged)->contains(fn ($m) => is_array($m) && ! empty($m['enabled']))) {
                    $validator->errors()->add('settings.payments', 'Keep at least one payment method switched on.');
                }
            }
        });
    }
}
