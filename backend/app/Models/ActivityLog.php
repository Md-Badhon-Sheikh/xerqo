<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    public const CATEGORIES = ['orders', 'payments', 'returns', 'catalog', 'customers', 'reviews', 'marketing', 'content', 'settings', 'sms', 'staff', 'auth'];

    protected $fillable = ['user_id', 'action', 'category', 'description', 'subject_type', 'subject_id', 'properties', 'ip', 'device'];

    protected function casts(): array
    {
        return ['properties' => 'array', 'created_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
