<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Tells the customer their order moved on (confirmed, shipped, delivered, cancelled).
 */
class OrderStatusUpdated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public const HEADLINES = [
        'confirmed' => 'Your order is confirmed',
        'shipped' => 'Your order is on the way',
        'delivered' => 'Your order has been delivered',
        'cancelled' => 'Your order was cancelled',
    ];

    public function __construct(public Order $order, public string $status) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: (self::HEADLINES[$this->status] ?? 'Order update')." · {$this->order->order_number}");
    }

    public function content(): Content
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return new Content(markdown: 'mail.order-status', with: [
            'headline' => self::HEADLINES[$this->status] ?? 'Order update',
            'trackUrl' => $frontend.'/track?order='.$this->order->order_number,
            'reviewUrl' => $frontend.'/account/review/'.$this->order->order_number,
        ]);
    }
}
