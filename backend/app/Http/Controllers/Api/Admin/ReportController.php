<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use App\Support\Media;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Sales analytics by order date: everything ordered in the range except cancelled and returned orders.
 */
class ReportController extends Controller
{
    private const SALE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

    /**
     * GET /api/admin/reports/sales?from=&to=
     */
    public function sales(Request $request): JsonResponse
    {
        $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from']]);
        $from = $request->filled('from') ? Carbon::parse($request->input('from'))->startOfDay() : now()->startOfMonth();
        $to = $request->filled('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();
        abort_if($from->diffInDays($to) > 731, 422, 'Pick a range of two years or less.');

        $days = (int) $from->diffInDays($to) + 1;
        $prevFrom = $from->copy()->subDays($days);
        $prevTo = $from->copy()->subSecond();

        $sales = fn (Carbon $a, Carbon $b) => Order::whereIn('status', self::SALE_STATUSES)->whereBetween('created_at', [$a, $b]);

        return response()->json([
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'days' => $days, 'previous' => ['from' => $prevFrom->toDateString(), 'to' => $prevTo->toDateString()]],
            'kpis' => $this->kpis($sales($from, $to), $from, $to),
            'previous' => $this->kpis($sales($prevFrom, $prevTo), $prevFrom, $prevTo),
            'series' => $this->series($from, $to),
            'categories' => $this->byCategory($from, $to),
            'products' => $this->topProducts($from, $to),
            'payments' => $sales($from, $to)->selectRaw('payment_method as method, COUNT(*) as orders, SUM(total) as revenue')->groupBy('payment_method')->orderByDesc('revenue')->get()
                ->map(fn ($r) => ['method' => $r->method, 'orders' => (int) $r->orders, 'revenue' => (float) $r->revenue]),
            'districts' => $sales($from, $to)->selectRaw('district, COUNT(*) as orders, SUM(total) as revenue')->groupBy('district')->orderByDesc('orders')->limit(8)->get()
                ->map(fn ($r) => ['district' => $r->district, 'orders' => (int) $r->orders, 'revenue' => (float) $r->revenue]),
            'coupons' => $sales($from, $to)->whereNotNull('coupon_code')->selectRaw('coupon_code as code, COUNT(*) as orders, SUM(discount) as discount')->groupBy('coupon_code')->orderByDesc('orders')->limit(6)->get()
                ->map(fn ($r) => ['code' => $r->code, 'orders' => (int) $r->orders, 'discount' => (float) $r->discount]),
        ]);
    }

    /**
     * @return array<string, float|int>
     */
    private function kpis(Builder $orders, Carbon $from, Carbon $to): array
    {
        $row = (clone $orders)->selectRaw('COUNT(*) as n, COALESCE(SUM(total), 0) as revenue, COALESCE(SUM(discount), 0) as discount, COALESCE(SUM(delivery_charge), 0) as delivery')->first();
        $units = (int) OrderItem::whereIn('order_id', (clone $orders)->select('id'))->sum('qty');
        $placed = Order::whereBetween('created_at', [$from, $to]);
        $cancelled = (clone $placed)->where('status', 'cancelled')->count();
        $returned = (clone $placed)->where('status', 'returned')->count();
        $delivered = (clone $placed)->where('status', 'delivered')->count();

        return [
            'revenue' => (float) $row->revenue,
            'orders' => (int) $row->n,
            'units' => $units,
            'average_order' => $row->n ? round($row->revenue / $row->n, 2) : 0,
            'discounts' => (float) $row->discount,
            'delivery_charges' => (float) $row->delivery,
            'cancelled' => $cancelled,
            'cancel_rate' => $placed->count() ? round($cancelled / $placed->count() * 100, 1) : 0,
            'return_rate' => $delivered + $returned ? round($returned / ($delivered + $returned) * 100, 1) : 0,
            'new_customers' => (int) Order::whereBetween('created_at', [$from, $to])->whereNotNull('user_id')
                ->whereNotIn('user_id', Order::where('created_at', '<', $from)->whereNotNull('user_id')->select('user_id'))
                ->distinct()->count('user_id'),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function series(Carbon $from, Carbon $to): array
    {
        $monthly = $from->diffInDays($to) > 62;
        $format = $monthly ? '%Y-%m' : '%Y-%m-%d';
        $bucket = DB::connection()->getDriverName() === 'sqlite' ? "strftime('{$format}', created_at)" : "DATE_FORMAT(created_at, '{$format}')";

        $rows = Order::whereIn('status', self::SALE_STATUSES)->whereBetween('created_at', [$from, $to])
            ->selectRaw("{$bucket} as bucket, COUNT(*) as orders, SUM(total) as revenue")->groupBy('bucket')->get()->keyBy('bucket');

        $points = [];
        for ($d = $from->copy(); $d <= $to; $monthly ? $d->addMonthNoOverflow()->startOfMonth() : $d->addDay()) {
            $k = $d->format($monthly ? 'Y-m' : 'Y-m-d');
            $points[] = ['key' => $k, 'label' => $d->format($monthly ? 'M y' : 'j M'), 'orders' => (int) ($rows[$k]->orders ?? 0), 'revenue' => (float) ($rows[$k]->revenue ?? 0)];
        }

        return $points;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function byCategory(Carbon $from, Carbon $to)
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('orders.status', self::SALE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->selectRaw("COALESCE(categories.name, 'Other') as name, SUM(order_items.qty) as units, SUM(order_items.total) as revenue")
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'units' => (int) $r->units, 'revenue' => (float) $r->revenue]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function topProducts(Carbon $from, Carbon $to)
    {
        $returns = ReturnRequest::query()
            ->join('order_items', 'order_items.id', '=', 'return_requests.order_item_id')
            ->whereBetween('return_requests.created_at', [$from, $to])
            ->whereIn('return_requests.status', ['approved', 'received', 'completed'])
            ->selectRaw('order_items.product_id, SUM(return_requests.qty) as qty')
            ->groupBy('order_items.product_id')
            ->pluck('qty', 'order_items.product_id');

        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', self::SALE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->whereNotNull('order_items.product_id')
            ->selectRaw('order_items.product_id, MAX(order_items.name) as name, MAX(order_items.image) as image, SUM(order_items.qty) as units, SUM(order_items.total) as revenue')
            ->groupBy('order_items.product_id')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->name,
                'image' => Media::url($r->image),
                'units' => (int) $r->units,
                'revenue' => (float) $r->revenue,
                'returned' => (int) ($returns[$r->product_id] ?? 0),
            ]);
    }
}
