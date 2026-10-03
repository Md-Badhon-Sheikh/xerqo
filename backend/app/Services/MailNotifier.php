<?php

namespace App\Services;

use App\Mail\NewOrderAlert;
use App\Mail\OrderPlaced;
use App\Mail\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Order emails over the hosting's SMTP (queued — sent by the queue worker / cron).
 * Switched on and off in Settings → SMS & Notifications ("email_notifications" setting).
 */
class MailNotifier
{
    public function orderPlaced(Order $order): void
    {
        if ($this->enabled('customer_order')) {
            $this->queue($this->customerEmail($order), new OrderPlaced($order));
        }

        if ($this->enabled('admin_new_order')) {
            $this->queue(Setting::getValue('email_notifications.admin_email'), new NewOrderAlert($order));
        }
    }

    public function statusChanged(Order $order, string $status): void
    {
        if (isset(OrderStatusUpdated::HEADLINES[$status]) && $this->enabled('customer_status')) {
            $this->queue($this->customerEmail($order), new OrderStatusUpdated($order, $status));
        }
    }

    private function enabled(string $key): bool
    {
        return (bool) Setting::getValue('email_notifications.'.$key, false);
    }

    private function customerEmail(Order $order): ?string
    {
        return $order->email ?: $order->user?->email;
    }

    private function queue(?string $to, Mailable $mail): void
    {
        if (blank($to) || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        // an email problem must never undo an order or a status change
        try {
            Mail::to($to)->queue($mail);
        } catch (Throwable $e) {
            Log::error('[Mail] could not queue '.class_basename($mail).': '.$e->getMessage());
        }
    }
}
