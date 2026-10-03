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
 * Order receipt for the customer.
 */
class OrderPlaced extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your XERQO order {$this->order->order_number} is received");
    }

    public function content(): Content
    {
        $this->order->loadMissing('items');

        return new Content(markdown: 'mail.order-placed', with: [
            'trackUrl' => rtrim((string) config('app.frontend_url'), '/').'/track?order='.$this->order->order_number,
        ]);
    }
}
