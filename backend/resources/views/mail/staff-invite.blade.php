<x-mail::message>
# Welcome to the XERQO team

Hi {{ $staff->name }},

{{ $invitedBy }} added you to the XERQO admin panel as **{{ $role }}**.

First, set your password: open the link below, keep your email address ({{ $staff->email }}), and we’ll email you a 6-digit code.

<x-mail::button :url="$setPasswordUrl">
Set my password
</x-mail::button>

After that, sign in any time at {{ $loginUrl }}.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
