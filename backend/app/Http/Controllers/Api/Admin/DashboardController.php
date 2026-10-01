<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\Review;
use App\Models\User;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard
     */
    public function __invoke(): JsonResponse
    {
        $revenueStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();
        $lastMonthStart = now()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = $monthStart->copy()->subSecond();

        $revenue = fn (Carbon $from, ?Carbon $to = null) => (float) Order::whereIn('status', $revenueStatuses)
            ->where('created_at', '>=', $from)
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
            ->sum('total');

        $ordersByStatus = Order::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        // Sales for the last 7 days (zero-filled).
        $from = now()->subDays(6)->startOfDay();
        $daily = Order::whereIn('status', $revenueStatuses)
            ->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $salesChart = collect(range(0, 6))->map(function (int $i) use ($from, $daily) {
            $day = $from->copy()->addDays($i)->toDateString();

            return [
                'date' => $day,
                'orders' => (int) ($daily[$day]->orders ?? 0),
                'revenue' => (float) ($daily[$day]->revenue ?? 0),
            ];
        });

        $topProducts = OrderItem::query()
            ->whereHas('order', fn ($q) => $q->whereIn('status', $revenueStatuses))
            ->whereNotNull('product_id')
            ->selectRaw('product_id, name, MAX(image) as image, SUM(qty) as sold, SUM(total) as revenue')
            ->groupBy('product_id', 'name')
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

        $lowStock = Product::whereColumn('stock', '<=', 'low_stock_threshold')
            ->where('status', '!=', 'draft')
            ->orderBy('stock')
            ->limit(10)
            ->get(['id', 'name', 'sku', 'stock', 'low_stock_threshold']);

        return response()->json([
            'data' => [
                'revenue' => [
                    'today' => $revenue($today),
                    'this_month' => $revenue($monthStart),
                    'last_month' => $revenue($lastMonthStart, $lastMonthEnd),
                ],
                'orders' => [
                    'today' => Order::where('created_at', '>=', $today)->count(),
                    'this_month' => Order::where('created_at', '>=', $monthStart)->count(),
                    'by_status' => collect(Order::STATUSES)->mapWithKeys(fn ($s) => [$s => (int) ($ordersByStatus[$s] ?? 0)]),
                ],
                'average_order_value' => round((float) Order::whereIn('status', $revenueStatuses)->avg('total'), 2),
                'customers' => [
                    'total' => User::customers()->count(),
                    'new_this_month' => User::customers()->where('created_at', '>=', $monthStart)->count(),
                ],
                'pending_reviews' => Review::where('status', Review::STATUS_PENDING)->count(),
                'pending_returns' => ReturnRequest::where('status', 'pending')->count(),
                'low_stock_count' => Product::whereColumn('stock', '<=', 'low_stock_threshold')->where('status', '!=', 'draft')->count(),
                'sales_chart' => $salesChart,
                'top_products' => $topProducts,
                'low_stock_products' => $lowStock,
                'recent_orders' => OrderResource::collection(
                    Order::withCount('items')->latest()->limit(8)->get()
                ),
            ],
        ]);
    }
}
