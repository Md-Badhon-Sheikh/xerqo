<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Thin SMS gateway wrapper.
 *
 * SMS_DRIVER=log (default) writes messages to storage/logs/laravel.log.
 * SMS_DRIVER=http POSTs {api_key, senderid, number, message} to SMS_API_URL, which matches most
 * Bangladeshi bulk SMS gateways (adjust the payload keys in send() to your provider's API).
 */
class SmsService
{
    public function send(string $phone, string $message): bool
    {
        $config = config('services.sms');

        if (($config['driver'] ?? 'log') !== 'http' || empty($config['url'])) {
            Log::info('[SMS] to '.$phone.': '.$message);

            return true;
        }

        try {
            $response = Http::asForm()->timeout(10)->post($config['url'], [
                'api_key' => $config['api_key'],
                'senderid' => $config['sender_id'],
                'number' => '88'.$phone,
                'message' => $message,
            ]);

            if ($response->failed()) {
                Log::warning('[SMS] gateway error', ['phone' => $phone, 'status' => $response->status(), 'body' => $response->body()]);
            }

            return $response->successful();
        } catch (Throwable $e) {
            Log::error('[SMS] '.$e->getMessage(), ['phone' => $phone]);

            return false;
        }
    }

    /**
     * Send one of the templates stored in the "sms_templates" setting, replacing {placeholders}.
     * Each template is stored as {"name": "...", "enabled": true, "body": "Hi {name}, ..."}.
     *
     * @param  array<string, string|int|float>  $data
     */
    public function sendTemplate(string $phone, string $template, array $data = []): bool
    {
        $config = Setting::getValue('sms_templates.'.$template);

        $body = is_array($config) ? ($config['body'] ?? null) : $config;
        $enabled = is_array($config) ? (bool) ($config['enabled'] ?? true) : true;

        if (! $enabled || ! is_string($body) || $body === '') {
            return false;
        }

        $replacements = [];
        foreach ($data as $key => $value) {
            $replacements['{'.$key.'}'] = (string) $value;
        }

        return $this->send($phone, strtr($body, $replacements));
    }
}
