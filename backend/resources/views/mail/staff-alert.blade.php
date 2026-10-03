<x-mail::message>
# {{ $alert['title'] }}

{{ $alert['body'] }}

<x-mail::button :url="$url">
Open in admin
</x-mail::button>

<small>Change which alerts you get by email in Admin → Notifications → Preferences.</small>
</x-mail::message>
