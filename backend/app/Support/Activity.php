<?php

namespace App\Support;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Throwable;

/**
 * Writes the staff audit trail. Never throws — logging must not break the action itself.
 */
class Activity
{
    /**
     * @param  array<string, mixed>  $properties
     */
    public static function log(string $action, string $category, string $description, ?Model $subject = null, array $properties = [], ?User $user = null): void
    {
        try {
            $request = request();

            ActivityLog::create([
                'user_id' => ($user ?? $request?->user())?->id,
                'action' => $action,
                'category' => $category,
                'description' => mb_substr($description, 0, 255),
                'subject_type' => $subject ? $subject->getMorphClass() : null,
                'subject_id' => $subject?->getKey(),
                'properties' => $properties ?: null,
                'ip' => $request?->ip(),
                'device' => Device::describe($request?->userAgent()),
            ]);
        } catch (Throwable $e) {
            report($e);
        }
    }
}
