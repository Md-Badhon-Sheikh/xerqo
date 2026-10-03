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
 * "New order" alert for the store's order inbox.
 */
class NewOrderAlert extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        $total = number_format($this->order->total);

        return new Envelope(subject: "New order {$this->order->order_number} · ৳{$total} · ".strtoupper($this->order->payment_method));
    }

    public function content(): Content
    {
        $this->order->loadMissing('items');

        return new Content(markdown: 'mail.new-order-alert', with: [
            'adminUrl' => rtrim((string) config('app.frontend_url'), '/').'/admin/orders/'.$this->order->order_number,
        ]);
    }
}
