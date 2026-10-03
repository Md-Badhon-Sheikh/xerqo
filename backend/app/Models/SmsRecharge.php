<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsRecharge extends Model
{
    protected $fillable = [
        'amount_paisa',
        'balance_after_paisa',
        'rate_paisa',
        'note',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount_paisa' => 'integer',
            'balance_after_paisa' => 'integer',
            'rate_paisa' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
