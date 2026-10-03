<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsLog extends Model
{
    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SKIPPED = 'skipped';

    protected $fillable = [
        'phone',
        'message',
        'template',
        'encoding',
        'segments',
        'cost_paisa',
        'status',
        'reason',
        'gateway_message_id',
        'gateway_response',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'segments' => 'integer',
            'cost_paisa' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
