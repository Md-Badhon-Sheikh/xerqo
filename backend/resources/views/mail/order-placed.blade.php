<x-mail::message>
# Thank you, {{ $order->name }}!

We have received your order **{{ $order->order_number }}**. Our team will call you on {{ $order->phone }} to confirm it before dispatch.

@include('mail._items')

**Payment:** {{ ['cod' => 'Cash on delivery', 'bkash' => 'bKash', 'rocket' => 'Rocket', 'nagad' => 'Nagad', 'bank' => 'Bank transfer'][$order->payment_method] ?? $order->payment_method }}@if ($order->payment_method !== 'cod') — we will confirm once your payment is verified.@endif

**Deliver to:** {{ $order->address_line }}{{ $order->area ? ', '.$order->area : '' }}, {{ $order->district }}

<x-mail::button :url="$trackUrl">
Track your order
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
