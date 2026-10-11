<?php

namespace App\Models;

use App\Support\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A message sent from the storefront Contact page (Admin → Messages).
 */
class ContactMessage extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'subject',
        'order_number',
        'message',
        'attachment',
        'ip',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(fn (ContactMessage $m) => Media::delete($m->attachment));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'order_number' => $this->order_number,
            'message' => $this->message,
            'attachment_url' => Media::url($this->attachment),
            'customer_id' => $this->user_id,
            'read' => $this->read_at !== null,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
