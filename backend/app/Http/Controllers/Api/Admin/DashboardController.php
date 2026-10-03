<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\Review;
use App\Models\User;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    // orders that count as sales (cancelled and returned ones do not)
    private const SALE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

    /**
     * GET /api/admin/dashboard?range=7d|30d|12m
     */
    public function __invoke(Request $request): JsonResponse
    {
        $range = in_array($request->input('range'), ['7d', '30d', '12m'], true) ? $request->input('range') : '30d';

        $today = now()->startOfDay();
        $yesterday = $today->copy()->subDay();
        $monthStart = now()->startOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();

        $sales = fn () => Order::whereIn('status', self::SALE_STATUSES);
        $sum = fn (Carbon $from, ?Carbon $to = null) => (float) $sales()->where('created_at', '>=', $from)->when($to, fn ($q) => $q->where('created_at', '<', $to))->sum('total');
        $count = fn (Carbon $from, ?Carbon $to = null) => Order::where('created_at', '>=', $from)->when($to, fn ($q) => $q->where('created_at', '<', $to))->count();
        $aov = function (Carbon $from, ?Carbon $to = null) use ($sales) {
            return round((float) $sales()->where('created_at', '>=', $from)->when($to, fn ($q) => $q->where('created_at', '<', $to))->avg('total'), 2);
        };

        // COD parcels still out with the courier or about to ship — cash we are waiting for
        $codOpen = Order::where('payment_method', 'cod')->where('payment_status', '!=', 'paid')->whereIn('status', ['confirmed', 'processing', 'shipped']);

        $byStatus = Order::selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json([
            'data' => [
                'kpis' => [
                    'revenue_today' => ['value' => $sum($today), 'previous' => $sum($yesterday, $today)],
                    'orders_today' => ['value' => $count($today), 'previous' => $count($yesterday, $today)],
                    'cod_pending' => ['value' => (float) (clone $codOpen)->sum('total'), 'orders' => (clone $codOpen)->count()],
                    'average_order' => ['value' => $aov($monthStart), 'previous' => $aov($lastMonthStart, $monthStart)],
                ],
                'chart' => $this->chart($range),
                'orders_by_status' => collect(Order::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($byStatus[$s] ?? 0)]),
                'tasks' => [
                    'orders_pending' => (int) ($byStatus['pending'] ?? 0),
                    'payments_to_verify' => Payment::where('status', Payment::STATUS_PENDING)->count(),
                    'to_ship' => Order::whereIn('status', ['confirmed', 'processing'])->count(),
                    'returns_pending' => ReturnRequest::where('status', 'pending')->count(),
                    'reviews_pending' => Review::where('status', Review::STATUS_PENDING)->count(),
                ],
                'customers' => [
                    'total' => User::customers()->count(),
                    'new_this_month' => User::customers()->where('created_at', '>=', $monthStart)->count(),
                ],
                'top_products' => $this->topProducts(now()->subDays(29)->startOfDay()),
                'low_stock' => [
                    'count' => Product::whereColumn('stock', '<=', 'low_stock_threshold')->where('status', '!=', 'draft')->count(),
                    'items' => Product::whereColumn('stock', '<=', 'low_stock_threshold')->where('status', '!=', 'draft')
                        ->with('primaryImage')->orderBy('stock')->limit(5)->get()
                        ->map(fn (Product $p) => ['id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'stock' => $p->stock, 'image' => Media::url($p->primaryImage?->path)]),
                ],
                'recent_orders' => OrderResource::collection(Order::withCount('items')->latest()->latest('id')->limit(6)->get()),
            ],
        ]);
    }

    /**
     * GET /api/admin/badges — sidebar counters, only for modules the user can open.
     */
    public function badges(Request $request): JsonResponse
    {
        $role = $request->user()->role;
        $can = fn (string $module) => (bool) $role?->allows($module);

        return response()->json(['data' => array_filter([
            'orders' => $can('orders') ? Order::where('status', 'pending')->count() : null,
            'returns' => $can('returns') ? ReturnRequest::where('status', 'pending')->count() : null,
            'reviews' => $can('reviews') ? Review::where('status', Review::STATUS_PENDING)->count() : null,
            'payments' => $can('payments') ? Payment::where('status', Payment::STATUS_PENDING)->count() : null,
            'shipments' => $can('shipments') ? Order::whereIn('status', ['confirmed', 'processing'])->count() : null,
        ], fn ($v) => $v !== null)]);
    }

    /**
     * Revenue and order counts per day (7d, 30d) or per month (12m), zero-filled, plus range totals.
     *
     * @return array<string, mixed>
     */
    private function chart(string $range): array
    {
        $monthly = $range === '12m';
        $from = $monthly ? now()->subMonthsNoOverflow(11)->startOfMonth() : now()->subDays($range === '7d' ? 6 : 29)->startOfDay();
        $format = $monthly ? '%Y-%m' : '%Y-%m-%d';
        $bucket = Order::query()->getConnection()->getDriverName() === 'sqlite'
            ? "strftime('{$format}', created_at)"
            : "DATE_FORMAT(created_at, '{$format}')";

        $rows = Order::whereIn('status', self::SALE_STATUSES)
            ->where('created_at', '>=', $from)
            ->selectRaw("{$bucket} as bucket, COUNT(*) as orders, SUM(total) as revenue")
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $points = collect(range(0, $monthly ? 11 : ($range === '7d' ? 6 : 29)))->map(function (int $i) use ($from, $monthly, $rows) {
            $date = $monthly ? $from->copy()->addMonthsNoOverflow($i) : $from->copy()->addDays($i);
            $key = $monthly ? $date->format('Y-m') : $date->toDateString();

            return [
                'key' => $key,
                'label' => $monthly ? $date->format('M') : ($date->format('j M')),
                'day' => $monthly ? null : $date->format('D'),
                'orders' => (int) ($rows[$key]->orders ?? 0),
                'revenue' => (float) ($rows[$key]->revenue ?? 0),
            ];
        });

        $returned = Order::where('status', 'returned')->where('created_at', '>=', $from)->count();
        $delivered = Order::where('status', 'delivered')->where('created_at', '>=', $from)->count();

        return [
            'range' => $range,
            'points' => $points,
            'revenue' => $points->sum('revenue'),
            'orders' => $points->sum('orders'),
            'return_rate' => $returned + $delivered > 0 ? round($returned / ($returned + $delivered) * 100, 1) : 0,
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function topProducts(Carbon $from)
    {
        return OrderItem::query()
            ->whereHas('order', fn ($q) => $q->whereIn('status', self::SALE_STATUSES)->where('created_at', '>=', $from))
            ->whereNotNull('product_id')
            ->selectRaw('product_id, MAX(name) as name, MAX(image) as image, SUM(qty) as sold, SUM(total) as revenue')
            ->groupBy('product_id')
            ->orderByDesc('sold')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->name,
                'image' => Media::url($row->image),
                'sold' => (int) $row->sold,
                'revenue' => (float) $row->revenue,
            ]);
    }
}
