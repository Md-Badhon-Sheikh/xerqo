<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * "You've been added to the XERQO admin" — with a link to set a password (via the reset-code flow).
 */
class StaffInvite extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $staff, public string $invitedBy) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You’ve been added to the XERQO admin');
    }

    public function content(): Content
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return new Content(markdown: 'mail.staff-invite', with: [
            'role' => $this->staff->role?->name ?? 'Staff',
            'setPasswordUrl' => $frontend.'/admin/forgot-password?identifier='.urlencode((string) $this->staff->email),
            'loginUrl' => $frontend.'/admin/login',
        ]);
    }
}
