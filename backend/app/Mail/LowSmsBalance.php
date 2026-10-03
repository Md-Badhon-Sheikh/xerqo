<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to Super Admins once the SMS wallet falls below the alert level.
 */
class LowSmsBalance extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public int $balancePaisa, public int $smsLeft) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'XERQO SMS balance is low');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.low-sms-balance', with: [
            'balance' => number_format($this->balancePaisa / 100, 2),
            'settingsUrl' => rtrim((string) config('app.frontend_url'), '/').'/admin/settings/sms',
        ]);
    }
}
