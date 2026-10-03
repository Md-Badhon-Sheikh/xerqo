<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ReturnRequest;
use App\Models\SmsRecharge;
use App\Support\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

/**
 * Cash-basis accounts: money in (verified online payments + COD collected on delivery),
 * money out (refunds, recorded expenses, SMS top-ups) and what is still to come.
 */
class AccountController extends Controller
{
    /**
     * GET /api/admin/accounts?from=2026-10-01&to=2026-10-31&page=
     */
    public function index(Request $request): JsonResponse
    {
        [$from, $to] = $this->range($request);
        $days = (int) $from->diffInDays($to) + 1;
        [$prevFrom, $prevTo] = [$from->copy()->subDays($days), $from->copy()->subSecond()];

        $now = $this->totals($from, $to);
        $prev = $this->totals($prevFrom, $prevTo);

        $all = $this->ledger($from, $to);
        $ledger = $request->filled('type') ? $all->where('type', $request->input('type'))->values() : $all;
        $perPage = min(max($request->integer('per_page', 25), 10), 500);
        $page = max(1, $request->integer('page', 1));

        return response()->json([
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'days' => $days, 'previous' => ['from' => $prevFrom->toDateString(), 'to' => $prevTo->toDateString()]],
            'totals' => $now,
            'previous' => $prev,
            'expected' => [
                // COD parcels confirmed/packed/on the road, not paid yet
                'cod_open' => (float) Order::where('payment_method', 'cod')->where('payment_status', '!=', 'paid')->whereIn('status', ['confirmed', 'processing', 'shipped'])->sum('total'),
                'cod_open_orders' => Order::where('payment_method', 'cod')->where('payment_status', '!=', 'paid')->whereIn('status', ['confirmed', 'processing', 'shipped'])->count(),
                'payments_pending' => (float) Payment::where('status', Payment::STATUS_PENDING)->sum('amount'),
                'payments_pending_count' => Payment::where('status', Payment::STATUS_PENDING)->count(),
                'refunds_due' => (float) ReturnRequest::where('status', 'received')->where('resolution', 'refund')->sum('amount'),
            ],
            'series' => $this->series($from, $to, $all),
            'counts' => ['all' => $all->count(), 'income' => $all->where('type', 'income')->count(), 'refund' => $all->where('type', 'refund')->count(), 'expense' => $all->where('type', 'expense')->count()],
            'expense_categories' => collect(Expense::CATEGORIES)->map(fn ($label, $key) => ['key' => $key, 'label' => $label, 'amount' => $now['expenses_by_category'][$key] ?? 0])->values(),
            'ledger' => $ledger->forPage($page, $perPage)->values(),
            'meta' => ['current_page' => $page, 'last_page' => max(1, (int) ceil($ledger->count() / $perPage)), 'from' => $ledger->isEmpty() ? null : ($page - 1) * $perPage + 1, 'to' => min($page * $perPage, $ledger->count()), 'total' => $ledger->count()],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function totals(Carbon $from, Carbon $to): array
    {
        $online = (float) Payment::where('status', Payment::STATUS_VERIFIED)->whereBetween('verified_at', [$from, $to])->sum('amount');
        $cod = (float) Order::where('payment_method', 'cod')->where('status', 'delivered')->whereBetween('delivered_at', [$from, $to])->sum('total');
        $refunds = (float) ReturnRequest::where('status', 'completed')->where('resolution', 'refund')->whereBetween('resolved_at', [$from, $to])->sum('amount');
        $byCategory = Expense::whereBetween('spent_on', [$from, $to])
            ->selectRaw('category, SUM(amount) as total')->groupBy('category')->pluck('total', 'category')->map(fn ($v) => (float) $v);
        $sms = SmsRecharge::where('amount_paisa', '>', 0)->whereBetween('created_at', [$from, $to])->sum('amount_paisa') / 100;
        $expenses = (float) $byCategory->sum() + $sms;
        $income = $online + $cod;

        return [
            'income' => $income,
            'income_online' => $online,
            'income_cod' => $cod,
            'refunds' => $refunds,
            'expenses' => $expenses,
            'expenses_by_category' => $byCategory->all(),
            'sms_topups' => (float) $sms,
            'profit' => $income - $refunds - $expenses,
        ];
    }

    /**
     * Every money movement in the range, newest first.
     */
    private function ledger(Carbon $from, Carbon $to): Collection
    {
        $rows = collect();

        Payment::with('order:id,order_number,name')->where('status', Payment::STATUS_VERIFIED)->whereBetween('verified_at', [$from, $to])->get()
            ->each(fn (Payment $p) => $rows->push(['type' => 'income', 'source' => $p->method, 'date' => $p->verified_at?->toIso8601String(), 'amount' => $p->amount,
                'title' => strtoupper($p->method).' payment · #'.$p->order?->order_number, 'sub' => trim(($p->order?->name ?? '').($p->transaction_id ? " · TxnID {$p->transaction_id}" : '')), 'link' => '/admin/orders/'.$p->order?->order_number]));

        Order::where('payment_method', 'cod')->where('status', 'delivered')->whereBetween('delivered_at', [$from, $to])->get(['order_number', 'name', 'total', 'delivered_at', 'courier'])
            ->each(fn (Order $o) => $rows->push(['type' => 'income', 'source' => 'cod', 'date' => $o->delivered_at?->toIso8601String(), 'amount' => $o->total,
                'title' => 'COD collected · #'.$o->order_number, 'sub' => trim($o->name.($o->courier ? " · {$o->courier}" : '')), 'link' => '/admin/orders/'.$o->order_number]));

        ReturnRequest::with('order:id,order_number,name')->where('status', 'completed')->where('resolution', 'refund')->whereBetween('resolved_at', [$from, $to])->get()
            ->each(fn (ReturnRequest $r) => $rows->push(['type' => 'refund', 'source' => 'refund', 'date' => $r->resolved_at?->toIso8601String(), 'amount' => -$r->amount,
                'title' => 'Refund R-'.$r->id.' · #'.$r->order?->order_number, 'sub' => $r->order?->name, 'link' => '/admin/returns']));

        Expense::with('user:id,name')->whereBetween('spent_on', [$from, $to])->get()
            ->each(fn (Expense $e) => $rows->push(['type' => 'expense', 'source' => $e->category, 'date' => $e->spent_on->toDateString(), 'amount' => -$e->amount, 'id' => $e->id,
                'title' => $e->description, 'sub' => (Expense::CATEGORIES[$e->category] ?? $e->category).' · '.(Expense::METHOD_LABELS[$e->method] ?? ucfirst($e->method)).($e->reference ? " · {$e->reference}" : ''),
                'receipt' => Media::url($e->receipt), 'by' => $e->user?->name,
                'expense' => ['category' => $e->category, 'method' => $e->method, 'reference' => $e->reference, 'description' => $e->description, 'amount' => $e->amount, 'spent_on' => $e->spent_on->toDateString()]]));

        SmsRecharge::where('amount_paisa', '>', 0)->whereBetween('created_at', [$from, $to])->get()
            ->each(fn (SmsRecharge $s) => $rows->push(['type' => 'expense', 'source' => 'sms', 'date' => $s->created_at?->toIso8601String(), 'amount' => -$s->amount_paisa / 100,
                'title' => 'SMS balance top-up', 'sub' => $s->note ?? 'Reve SMS', 'link' => '/admin/settings/sms']));

        return $rows->sortByDesc('date')->values();
    }

    /**
     * Money in vs out per day (ranges up to 62 days) or per month.
     *
     * @return array<int, array{label: string, income: float, out: float}>
     */
    private function series(Carbon $from, Carbon $to, Collection $ledger): array
    {
        $monthly = $from->diffInDays($to) > 62;
        $key = fn (string $date) => Carbon::parse($date)->format($monthly ? 'Y-m' : 'Y-m-d');
        $grouped = $ledger->groupBy(fn ($r) => $key($r['date']));

        $points = [];
        for ($d = $from->copy()->startOfDay(); $d <= $to; $monthly ? $d->addMonthNoOverflow()->startOfMonth() : $d->addDay()) {
            $k = $d->format($monthly ? 'Y-m' : 'Y-m-d');
            $rows = $grouped[$k] ?? collect();
            $points[] = [
                'key' => $k,
                'label' => $d->format($monthly ? 'M y' : 'j M'),
                'income' => (float) $rows->where('amount', '>', 0)->sum('amount'),
                'out' => (float) -$rows->where('amount', '<', 0)->sum('amount'),
            ];
        }

        return $points;
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function range(Request $request): array
    {
        $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from']]);
        $from = $request->filled('from') ? Carbon::parse($request->input('from'))->startOfDay() : now()->startOfMonth();
        $to = $request->filled('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();

        if ($from->diffInDays($to) > 731) {
            abort(422, 'Pick a range of two years or less.');
        }

        return [$from, $to];
    }

    /**
     * POST /api/admin/expenses (multipart: spent_on, category, amount, method, description, reference, receipt)
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['receipt'] = $request->hasFile('receipt') ? Media::store($request->file('receipt'), 'receipts') : null;
        $expense = Expense::create([...$data, 'user_id' => $request->user()->id]);

        return response()->json(['data' => $expense], 201);
    }

    /**
     * PUT /api/admin/expenses/{expense} — "remove_receipt": true drops the file.
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('receipt') || $request->boolean('remove_receipt')) {
            Media::delete($expense->receipt);
            $data['receipt'] = $request->hasFile('receipt') ? Media::store($request->file('receipt'), 'receipts') : null;
        }

        $expense->update($data);

        return response()->json(['data' => $expense]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        Media::delete($expense->receipt);
        $expense->delete();

        return response()->json(['message' => 'Expense deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'spent_on' => ['required', 'date', 'before_or_equal:today'],
            'category' => ['required', Rule::in(array_keys(Expense::CATEGORIES))],
            'amount' => ['required', 'numeric', 'min:1', 'max:10000000'],
            'method' => ['required', Rule::in(Expense::METHODS)],
            'description' => ['required', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:100'],
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], ['spent_on.before_or_equal' => 'The date can’t be in the future.']);
    }
}
