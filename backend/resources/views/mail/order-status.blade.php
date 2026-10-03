<x-mail::message>
# {{ $headline }}

Hi {{ $order->name }},

@switch($status)
@case('confirmed')
Your order **{{ $order->order_number }}** (৳{{ number_format($order->total) }}) is confirmed and is being prepared in our workshop.
@break
@case('shipped')
Your order **{{ $order->order_number }}** is on the way{{ $order->courier ? ' with '.$order->courier : '' }}.@if ($order->tracking_code) Tracking number: **{{ $order->tracking_code }}**.@endif
@if ($order->payment_status !== 'paid')

Please keep **৳{{ number_format($order->total) }}** ready for the rider.
@endif
@break
@case('delivered')
Your order **{{ $order->order_number }}** has been delivered. We hope you love it — a short review helps other shoppers a lot.
@break
@case('cancelled')
Your order **{{ $order->order_number }}** has been cancelled. If you paid in advance, we will contact you about the refund. Questions? Just reply to this email.
@break
@endswitch

@if ($status === 'delivered')
<x-mail::button :url="$reviewUrl">
Write a review
</x-mail::button>
@elseif ($status !== 'cancelled')
<x-mail::button :url="$trackUrl">
Track your order
</x-mail::button>
@endif

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
