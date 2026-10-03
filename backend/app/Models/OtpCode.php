<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    public const MAX_ATTEMPTS = 5;

    protected $fillable = [
        'identifier',
        'purpose',
        'code_hash',
        'attempts',
        'expires_at',
        'consumed_at',
        'ip',
    ];

    protected $hidden = ['code_hash'];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function isUsable(): bool
    {
        return $this->consumed_at === null
            && $this->expires_at->isFuture()
            && $this->attempts < self::MAX_ATTEMPTS;
    }
}
