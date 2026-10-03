<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The Reve SMS account and the prepaid SMS wallet. There is only ever one row — use SmsGateway::current().
 */
class SmsGateway extends Model
{
    protected $table = 'sms_gateway';

    protected $fillable = [
        'provider',
        'is_enabled',
        'api_url',
        'balance_url',
        'api_key',
        'secret_key',
        'sender_id',
        'client_id',
        'rate_paisa',
        'balance_paisa',
        'low_balance_paisa',
        'low_alert_sent_at',
    ];

    protected $hidden = ['api_key', 'secret_key'];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'api_key' => 'encrypted',
            'secret_key' => 'encrypted',
            'rate_paisa' => 'integer',
            'balance_paisa' => 'integer',
            'low_balance_paisa' => 'integer',
            'low_alert_sent_at' => 'datetime',
        ];
    }

    public static function current(): self
    {
        return static::query()->oldest('id')->first() ?? static::create([])->refresh();
    }

    public function isConfigured(): bool
    {
        return filled($this->api_key) && filled($this->secret_key) && filled($this->sender_id);
    }

    /**
     * How many single-segment SMS the balance still covers.
     */
    public function smsLeft(): int
    {
        return $this->rate_paisa > 0 ? intdiv(max(0, $this->balance_paisa), $this->rate_paisa) : 0;
    }

    /**
     * "••••••••3f9a" — enough to recognise a key without revealing it.
     */
    public static function mask(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        return str_repeat('•', 8).substr($value, -4);
    }
}
