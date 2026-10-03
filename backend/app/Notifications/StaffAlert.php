<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * In-app alert in the admin notifications feed (database channel, stored right away).
 */
class StaffAlert extends Notification
{
    /**
     * @param  array{event: string, category: string, title: string, body: string, link: string, tone: string}  $payload
     */
    public function __construct(public array $payload) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload;
    }
}
