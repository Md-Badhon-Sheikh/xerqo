<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * The 6-digit password reset code, sent right away (not queued) so it arrives while the person waits.
 */
class PasswordResetCode extends Mailable
{
    use Queueable;

    public function __construct(public string $name, public string $code, public int $minutes) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your XERQO password reset code: {$this->code}");
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.password-reset-code');
    }
}
