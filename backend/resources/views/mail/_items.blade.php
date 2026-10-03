<x-mail::table>
| Item | Qty | Amount |
|:-----|:---:|-------:|
@foreach ($order->items as $item)
| {{ $item->name }}{{ $item->variant_name ? ' · '.$item->variant_name : '' }} | {{ $item->qty }} | ৳{{ number_format($item->total) }} |
@endforeach
| Subtotal | | ৳{{ number_format($order->subtotal) }} |
| Delivery | | ৳{{ number_format($order->delivery_charge) }} |
@if ($order->discount > 0)
| Discount{{ $order->coupon_code ? ' ('.$order->coupon_code.')' : '' }} | | −৳{{ number_format($order->discount) }} |
@endif
| **Total** | | **৳{{ number_format($order->total) }}** |
</x-mail::table>
