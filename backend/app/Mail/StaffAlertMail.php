<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email copy of a staff alert, for staff who switched email on for that event.
 */
class StaffAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array{title: string, body: string, link: string}  $alert
     */
    public function __construct(public array $alert) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'XERQO admin · '.$this->alert['title']);
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.staff-alert', with: [
            'url' => rtrim((string) config('app.frontend_url'), '/').$this->alert['link'],
        ]);
    }
}
