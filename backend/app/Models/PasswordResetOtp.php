<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordResetOtp extends Model
{
    public const MAX_ATTEMPTS = 5;

    protected $fillable = [
        'user_id',
        'identifier',
        'otp_hash',
        'attempts',
        'expires_at',
    ];

    protected $hidden = [
        'otp_hash',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isUsable(): bool
    {
        return $this->expires_at->isFuture() && $this->attempts < self::MAX_ATTEMPTS;
    }
}
