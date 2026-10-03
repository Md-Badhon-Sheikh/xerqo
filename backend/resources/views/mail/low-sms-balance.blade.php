<x-mail::message>
# SMS balance is low

The XERQO SMS wallet has **৳{{ $balance }}** left — about **{{ number_format($smsLeft) }} SMS**.

When the balance runs out, order updates and sign-in codes stop going out. Add balance from SMS settings.

<x-mail::button :url="$settingsUrl">
Open SMS settings
</x-mail::button>
</x-mail::message>
