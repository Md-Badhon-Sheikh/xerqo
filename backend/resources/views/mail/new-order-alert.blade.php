<x-mail::message>
# New order {{ $order->order_number }}

**{{ $order->name }}** · {{ $order->phone }} · {{ $order->district }}

@include('mail._items')

**Payment:** {{ strtoupper($order->payment_method) }} · {{ $order->payment_status }}

@if ($order->note)
**Customer note:** {{ $order->note }}
@endif

<x-mail::button :url="$adminUrl">
Open in admin
</x-mail::button>
</x-mail::message>
