<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\SmsLog;
use App\Models\User;
use App\Services\SmsService;
use App\Support\CustomerSegment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    private const DISTRICT = '(select a.district from addresses a where a.user_id = users.id order by a.is_default desc, a.id limit 1)';

    /**
     * GET /api/admin/customers?q=&segment=vip|regular|new|risky&district=&status=active|blocked|cod_blocked&page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'segment' => ['nullable', Rule::in(CustomerSegment::SEGMENTS)],
            'status' => ['nullable', Rule::in(['active', 'blocked', 'cod_blocked'])],
            'q' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:60'],
        ]);

        $query = CustomerSegment::withStats(User::customers())
            ->selectRaw(self::DISTRICT.' as district')
            ->withCount(['orders'])
            ->withMax('orders', 'created_at')
            ->when($request->filled('q'), function (Builder $q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('users.name', 'like', $term)->orWhere('users.email', 'like', $term)->orWhere('users.phone', 'like', $term));
            })
            ->when($request->filled('district'), function (Builder $q) use ($request) {
                $district = $request->input('district');
                $q->where(fn ($w) => $w->whereHas('addresses', fn ($a) => $a->where('district', $district))
                    ->orWhereHas('orders', fn ($o) => $o->where('district', $district)));
            })
            ->when($request->input('status') === 'active', fn ($q) => $q->where('users.is_active', true))
            ->when($request->input('status') === 'blocked', fn ($q) => $q->where('users.is_active', false))
            ->when($request->input('status') === 'cod_blocked', fn ($q) => $q->where('users.cod_blocked', true))
            ->when($request->filled('segment'), fn ($q) => CustomerSegment::filter($q, $request->input('segment')));

        $page = $query->latest('users.created_at')->latest('users.id')->paginate(min($request->integer('per_page', 20), 100));

        return response()->json([
            'data' => $page->getCollection()->map(fn (User $u) => $this->row($u)),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'from' => $page->firstItem(),
                'to' => $page->lastItem(),
                'total' => $page->total(),
                'summary' => $this->summary(),
            ],
        ]);
    }

    /**
     * GET /api/admin/customers/{id}
     */
    public function show(User $customer): JsonResponse
    {
        abort_if($customer->isStaff(), 404);

        /** @var User $c */
        $c = CustomerSegment::withStats(User::query())->withCount(['orders', 'reviews'])->withMax('orders', 'created_at')->findOrFail($customer->id);
        $orders = $c->orders()->withCount('items')->with('items:id,order_id,image')->latest()->limit(20)->get();

        return response()->json([
            'data' => [
                ...$this->row($c),
                'date_of_birth' => $c->date_of_birth?->toDateString(),
                'phone_verified' => $c->phone_verified_at !== null,
                'notify_order_sms' => (bool) $c->notify_order_sms,
                'marketing_sms' => (bool) $c->marketing_sms,
                'marketing_email' => (bool) $c->marketing_email,
                'admin_note' => $c->admin_note,
                'last_login_at' => $c->last_login_at?->toIso8601String(),
                'reviews_count' => $c->reviews_count,
                'average_order' => round((float) $c->spent / max(1, $c->orders()->whereNotIn('status', ['cancelled', 'returned'])->count()), 2),
                'orders' => OrderResource::collection($orders),
                'addresses' => AddressResource::collection($c->addresses()->orderByDesc('is_default')->get()),
                'activity' => $this->activity($c),
                'sms' => SmsLog::where('phone', $c->phone)->latest('id')->limit(5)->get(['id', 'message', 'status', 'template', 'created_at']),
            ],
        ]);
    }

    /**
     * PATCH /api/admin/customers/{id} {"admin_note": "...", "cod_blocked": true, "is_active": false}
     */
    public function update(Request $request, User $customer): JsonResponse
    {
        abort_if($customer->isStaff(), 404);

        $data = $request->validate([
            'admin_note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'cod_blocked' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $customer->update($data);

        // a disabled account is signed out everywhere
        if (array_key_exists('is_active', $data) && ! $data['is_active']) {
            $customer->tokens()->delete();
        }

        return $this->show($customer);
    }

    /**
     * POST /api/admin/customers/{id}/sms {"message": "..."} — a one-off SMS, paid from the SMS balance.
     */
    public function sms(Request $request, User $customer, SmsService $sms): JsonResponse
    {
        abort_if($customer->isStaff() || blank($customer->phone), 404);

        $data = $request->validate(['message' => ['required', 'string', 'max:670']]);
        $log = $sms->deliver($customer->phone, $data['message'], 'manual', $request->user());

        if ($log->status !== SmsLog::STATUS_SENT) {
            return response()->json(['message' => 'SMS not sent: '.$log->reason.'.'], 422);
        }

        return response()->json(['message' => "SMS sent to {$customer->phone} ({$log->segments} SMS)."]);
    }

    /**
     * @return array<string, mixed>
     */
    private function row(User $u): array
    {
        $delivered = (int) $u->delivered_count;
        $returned = (int) $u->returned_count;

        return [
            'id' => $u->id,
            'name' => $u->name,
            'phone' => $u->phone,
            'email' => $u->email,
            'district' => $u->district ?? $u->addresses()->orderByDesc('is_default')->value('district'),
            'orders_count' => (int) $u->orders_count,
            'spent' => (float) $u->spent,
            'delivered' => $delivered,
            'returned' => $returned,
            'success_rate' => CustomerSegment::successRate($delivered, $returned),
            'segment' => CustomerSegment::for([
                'cod_blocked' => (bool) $u->cod_blocked,
                'delivered' => $delivered,
                'returned' => $returned,
                'spent' => (float) $u->spent,
            ]),
            'last_order_at' => $u->orders_max_created_at ? Carbon::parse($u->orders_max_created_at)->toIso8601String() : null,
            'is_active' => (bool) $u->is_active,
            'cod_blocked' => (bool) $u->cod_blocked,
            'created_at' => $u->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, int|float>
     */
    private function summary(): array
    {
        $buyers = Order::whereNotNull('user_id')->whereNotIn('status', ['cancelled'])
            ->selectRaw('user_id, COUNT(*) as n')->groupBy('user_id')->pluck('n');

        return [
            'total' => User::customers()->count(),
            'new_this_month' => User::customers()->where('created_at', '>=', now()->startOfMonth())->count(),
            'repeat_rate' => $buyers->count() ? round($buyers->filter(fn ($n) => $n >= 2)->count() / $buyers->count() * 100, 1) : 0,
            'flagged' => User::customers()->where(fn ($q) => $q->where('cod_blocked', true)->orWhere('is_active', false))->count(),
        ];
    }

    /**
     * Latest things the customer did, newest first.
     *
     * @return array<int, array{text: string, at: string|null, type: string}>
     */
    private function activity(User $c): array
    {
        $events = collect([['text' => 'Created an account', 'at' => $c->created_at, 'type' => 'account']]);

        foreach ($c->orders()->latest()->limit(10)->get(['order_number', 'total', 'status', 'created_at', 'delivered_at']) as $o) {
            $events->push(['text' => "Placed order #{$o->order_number} (Tk ".number_format($o->total).')', 'at' => $o->created_at, 'type' => 'order']);
            if ($o->delivered_at) {
                $events->push(['text' => "Order #{$o->order_number} delivered", 'at' => $o->delivered_at, 'type' => 'delivered']);
            }
        }
        foreach ($c->reviews()->with('product:id,name')->latest()->limit(5)->get() as $r) {
            $events->push(['text' => "Left a {$r->rating}★ review on ".($r->product?->name ?? 'a product'), 'at' => $r->created_at, 'type' => 'review']);
        }
        foreach ($c->returnRequests()->with('order:id,order_number')->latest()->limit(5)->get() as $r) {
            $events->push(['text' => 'Requested a return on #'.($r->order?->order_number ?? '—'), 'at' => $r->created_at, 'type' => 'return']);
        }
        if ($c->last_login_at) {
            $events->push(['text' => 'Last signed in', 'at' => $c->last_login_at, 'type' => 'login']);
        }

        return $events->filter(fn ($e) => $e['at'])->sortByDesc('at')->take(12)
            ->map(fn ($e) => [...$e, 'at' => $e['at']->toIso8601String()])->values()->all();
    }
}
