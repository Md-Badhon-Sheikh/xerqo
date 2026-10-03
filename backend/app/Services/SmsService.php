<?php

namespace App\Services;

use App\Mail\LowSmsBalance;
use App\Models\Role;
use App\Models\Setting;
use App\Models\SmsGateway;
use App\Models\SmsLog;
use App\Models\User;
use App\Support\SmsSegments;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends SMS through Reve SMS, paid from the store's prepaid SMS wallet.
 *
 * Every message is written to sms_logs. A message only goes out when:
 * - the Super Admin has not switched SMS off,
 * - the wallet covers its cost (parts × rate) — the cost is taken atomically before sending
 *   and given back if the gateway refuses the message.
 *
 * SMS_DRIVER=log (local default) charges the wallet and logs, but writes the text to laravel.log
 * instead of calling Reve. SMS_DRIVER=reve sends for real.
 */
class SmsService
{
    // templates a customer can turn off with "Order updates by SMS"
    private const OPTIONAL_TEMPLATES = ['order_placed', 'order_confirmed', 'order_processing', 'order_shipped', 'out_for_delivery', 'order_delivered_review', 'abandoned_cart'];

    private const REVE_ERRORS = [
        '1' => 'Request failed',
        '101' => 'Reve internal server error',
        '108' => 'Wrong or missing secret key',
        '109' => 'Reve user missing or deleted',
        '114' => 'Message text missing',
        '-42' => 'Reve authorization failed',
    ];

    public function send(string $phone, string $message, ?string $template = null, ?User $by = null): bool
    {
        return $this->deliver($phone, $message, $template, $by)->status === SmsLog::STATUS_SENT;
    }

    /**
     * Same as send(), but returns the log row so callers can show why a message did not go out.
     */
    public function deliver(string $phone, string $message, ?string $template = null, ?User $by = null): SmsLog
    {
        $gateway = SmsGateway::current();
        $parts = SmsSegments::analyse($message);
        $cost = $parts['segments'] * $gateway->rate_paisa;
        $driver = config('services.sms.driver', 'log');

        $log = new SmsLog([
            'phone' => $phone,
            'message' => $message,
            'template' => $template,
            'encoding' => $parts['encoding'],
            'segments' => $parts['segments'],
            'cost_paisa' => 0,
            'user_id' => $by?->id,
        ]);

        $skip = function (string $reason) use ($log) {
            $log->fill(['status' => SmsLog::STATUS_SKIPPED, 'reason' => $reason])->save();

            return $log;
        };

        if (! $gateway->is_enabled) {
            return $skip('SMS is switched off');
        }

        if ($driver === 'reve' && ! $gateway->isConfigured()) {
            return $skip('Reve API key, secret key or sender ID missing');
        }

        // take the cost only while the wallet covers it — a single UPDATE, safe under concurrent orders
        $charged = SmsGateway::whereKey($gateway->id)->where('balance_paisa', '>=', $cost)->decrement('balance_paisa', $cost);
        if (! $charged) {
            return $skip('SMS balance too low');
        }

        $result = $driver === 'reve' ? $this->sendViaReve($gateway, $phone, $message) : $this->sendToLog($phone, $message);

        if (! $result['ok']) {
            SmsGateway::whereKey($gateway->id)->increment('balance_paisa', $cost);
        }

        $log->fill([
            'status' => $result['ok'] ? SmsLog::STATUS_SENT : SmsLog::STATUS_FAILED,
            'cost_paisa' => $result['ok'] ? $cost : 0,
            'reason' => $result['ok'] ? null : $result['error'],
            'gateway_message_id' => $result['message_id'] ?? null,
            'gateway_response' => isset($result['response']) ? mb_substr($result['response'], 0, 1000) : null,
        ])->save();

        if ($result['ok']) {
            $this->checkLowBalance($gateway->id);
        }

        return $log;
    }

    /**
     * Send one of the templates stored in the "sms_templates" setting, replacing {placeholders}.
     * Each template is stored as {"name": "...", "enabled": true, "body": "Hi {name}, ..."}.
     *
     * @param  array<string, string|int|float>  $data
     */
    public function sendTemplate(string $phone, string $template, array $data = []): bool
    {
        $body = $this->renderTemplate($template, $data);

        if ($body === null) {
            return false;
        }

        if (in_array($template, self::OPTIONAL_TEMPLATES, true)
            && User::where('phone', $phone)->where('notify_order_sms', false)->exists()) {
            SmsLog::create([
                'phone' => $phone, 'message' => $body, 'template' => $template, 'status' => SmsLog::STATUS_SKIPPED,
                'reason' => 'Customer turned off order SMS', ...array_intersect_key(SmsSegments::analyse($body), array_flip(['encoding', 'segments'])),
            ]);

            return false;
        }

        return $this->send($phone, $body, $template);
    }

    /**
     * The template text with {placeholders} filled in, or null when the template is off or empty.
     *
     * @param  array<string, string|int|float>  $data
     */
    public function renderTemplate(string $template, array $data = []): ?string
    {
        $config = Setting::getValue('sms_templates.'.$template);

        $body = is_array($config) ? ($config['body'] ?? null) : $config;
        $enabled = is_array($config) ? (bool) ($config['enabled'] ?? true) : true;

        if (! $enabled || ! is_string($body) || trim($body) === '') {
            return null;
        }

        $replacements = [];
        foreach ($data as $key => $value) {
            $replacements['{'.$key.'}'] = (string) $value;
        }

        return strtr($body, $replacements);
    }

    /**
     * Reve's own account balance (in Taka), when the Super Admin has entered the Reve client id.
     */
    public function remoteBalance(SmsGateway $gateway): ?float
    {
        if (blank($gateway->client_id)) {
            return null;
        }

        try {
            $response = Http::timeout(10)->get(rtrim($gateway->balance_url, '/').'/sms/smsConfiguration/smsClientBalance.jsp', [
                'client' => $gateway->client_id,
            ]);

            $text = trim($response->body());
            if ($response->successful() && is_numeric($text)) {
                return (float) $text;
            }

            // some accounts answer with JSON {"Balance": "123.45"}
            $balance = $response->json('Balance') ?? $response->json('balance');

            return is_numeric($balance) ? (float) $balance : null;
        } catch (Throwable $e) {
            Log::warning('[SMS] balance check failed: '.$e->getMessage());

            return null;
        }
    }

    /**
     * @return array{ok: bool, error?: string, message_id?: string|null, response?: string}
     */
    private function sendViaReve(SmsGateway $gateway, string $phone, string $message): array
    {
        try {
            $response = Http::asForm()->timeout(15)->post(rtrim($gateway->api_url, '/').'/sendtext', [
                'apikey' => $gateway->api_key,
                'secretkey' => $gateway->secret_key,
                'callerID' => $gateway->sender_id,
                'toUser' => '88'.$phone,
                'messageContent' => $message,
            ]);

            $status = (string) ($response->json('Status') ?? '');

            if ($response->successful() && $status === '0') {
                return ['ok' => true, 'message_id' => $response->json('Message_ID'), 'response' => $response->body()];
            }

            $error = self::REVE_ERRORS[$status] ?? ($response->json('Text') ?: 'Gateway error (HTTP '.$response->status().')');
            Log::warning('[SMS] Reve refused the message', ['phone' => $phone, 'status' => $status, 'body' => $response->body()]);

            return ['ok' => false, 'error' => $error, 'response' => $response->body()];
        } catch (Throwable $e) {
            Log::error('[SMS] '.$e->getMessage(), ['phone' => $phone]);

            return ['ok' => false, 'error' => 'Could not reach Reve SMS'];
        }
    }

    /**
     * @return array{ok: bool, message_id: null, response: string}
     */
    private function sendToLog(string $phone, string $message): array
    {
        Log::info('[SMS] to '.$phone.': '.$message);

        return ['ok' => true, 'message_id' => null, 'response' => 'Written to laravel.log (SMS_DRIVER=log)'];
    }

    /**
     * Email the Super Admins once when the wallet drops below the alert level (re-armed by a top-up).
     */
    private function checkLowBalance(int $gatewayId): void
    {
        $gateway = SmsGateway::find($gatewayId);

        if (! $gateway || $gateway->balance_paisa >= $gateway->low_balance_paisa || $gateway->low_alert_sent_at) {
            return;
        }

        // only the request that flips the flag sends the email
        if (! SmsGateway::whereKey($gatewayId)->whereNull('low_alert_sent_at')->update(['low_alert_sent_at' => now()])) {
            return;
        }

        $emails = User::whereHas('role', fn ($q) => $q->where('slug', Role::SUPER_ADMIN))
            ->where('is_active', true)->whereNotNull('email')->pluck('email');

        foreach ($emails as $email) {
            Mail::to($email)->queue(new LowSmsBalance($gateway->balance_paisa, $gateway->smsLeft()));
        }

        // in-app too, but not by email again (the email above already went out)
        app(AdminNotifier::class)->notify(
            'sms_balance',
            'SMS balance is low',
            '৳'.number_format($gateway->balance_paisa / 100, 2).' left — about '.number_format($gateway->smsLeft()).' SMS',
            '/admin/settings/sms',
        );
    }
}
