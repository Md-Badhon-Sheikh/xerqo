<x-mail::message>
# Password reset code

Hi {{ $name }},

Use this code to set a new XERQO password:

<x-mail::panel>
<div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; text-align: center;">{{ $code }}</div>
</x-mail::panel>

It expires in {{ $minutes }} minutes. If you didn’t ask for this, you can ignore this email — your password stays the same.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
