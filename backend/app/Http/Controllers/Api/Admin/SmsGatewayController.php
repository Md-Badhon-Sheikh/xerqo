<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmsGateway;
use App\Models\SmsRecharge;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Super Admin only: Reve credentials, the SMS on/off switch, per-SMS price and the prepaid balance.
 */
class SmsGatewayController extends Controller
{
    /**
     * GET /api/admin/sms/gateway
     */
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->present(SmsGateway::current())]);
    }

    /**
     * PUT /api/admin/sms/gateway — any subset of the fields. Blank api_key / secret_key keep the saved ones.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'api_url' => ['sometimes', 'url', 'max:255'],
            'balance_url' => ['sometimes', 'url', 'max:255'],
            'api_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'secret_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sender_id' => ['sometimes', 'nullable', 'string', 'max:30'],
            'client_id' => ['sometimes', 'nullable', 'string', 'max:60'],
            'rate_paisa' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'low_balance' => ['sometimes', 'numeric', 'min:0', 'max:100000'],
        ]);

        foreach (['api_key', 'secret_key'] as $secret) {
            if (blank($data[$secret] ?? null)) {
                unset($data[$secret]);
            }
        }

        if (array_key_exists('low_balance', $data)) {
            $data['low_balance_paisa'] = (int) round($data['low_balance'] * 100);
            unset($data['low_balance']);
        }

        $gateway = SmsGateway::current();
        $gateway->fill($data);

        // a higher alert level or a lower balance re-arms the low-balance email
        if ($gateway->balance_paisa >= $gateway->low_balance_paisa) {
            $gateway->low_alert_sent_at = null;
        }

        $gateway->save();

        return response()->json(['data' => $this->present($gateway->refresh())]);
    }

    /**
     * GET /api/admin/sms/recharges — top-up history, newest first.
     */
    public function recharges(Request $request): JsonResponse
    {
        $page = SmsRecharge::with('user:id,name')->latest('id')->paginate(min(50, (int) $request->input('per_page', 10)));

        return response()->json([
            'data' => $page->getCollection()->map(fn (SmsRecharge $r) => [
                'id' => $r->id,
                'amount' => $r->amount_paisa / 100,
                'balance_after' => $r->balance_after_paisa / 100,
                'rate_paisa' => $r->rate_paisa,
                'sms' => $r->rate_paisa ? intdiv(abs($r->amount_paisa), $r->rate_paisa) * ($r->amount_paisa < 0 ? -1 : 1) : 0,
                'note' => $r->note,
                'by' => $r->user?->name,
                'created_at' => $r->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'from' => $page->firstItem(), 'to' => $page->lastItem(), 'total' => $page->total()],
        ]);
    }

    /**
     * POST /api/admin/sms/recharges {"amount": 500, "note": "bKash to Reve, TrxID …"}
     * A negative amount corrects a mistake; the balance can never go below zero.
     */
    public function recharge(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'between:-100000,100000', 'not_in:0'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $paisa = (int) round($data['amount'] * 100);

        $recharge = DB::transaction(function () use ($paisa, $data, $request) {
            $gateway = SmsGateway::whereKey(SmsGateway::current()->id)->lockForUpdate()->first();
            $after = $gateway->balance_paisa + $paisa;

            if ($after < 0) {
                throw ValidationException::withMessages(['amount' => 'The balance cannot go below ৳0 (current ৳'.number_format($gateway->balance_paisa / 100, 2).').']);
            }

            $gateway->balance_paisa = $after;
            if ($after >= $gateway->low_balance_paisa) {
                $gateway->low_alert_sent_at = null;
            }
            $gateway->save();

            return SmsRecharge::create([
                'amount_paisa' => $paisa,
                'balance_after_paisa' => $after,
                'rate_paisa' => $gateway->rate_paisa,
                'note' => $data['note'] ?? null,
                'user_id' => $request->user()->id,
            ]);
        });

        return response()->json([
            'message' => ($paisa > 0 ? 'Added' : 'Removed').' ৳'.number_format(abs($paisa) / 100, 2).'. New balance ৳'.number_format($recharge->balance_after_paisa / 100, 2).'.',
            'data' => $this->present(SmsGateway::current()),
        ], 201);
    }

    /**
     * GET /api/admin/sms/gateway/remote-balance — the balance Reve itself reports (needs the Reve client id).
     */
    public function remoteBalance(SmsService $sms): JsonResponse
    {
        $gateway = SmsGateway::current();

        if (blank($gateway->client_id)) {
            throw ValidationException::withMessages(['client_id' => 'Enter your Reve client id to check the Reve account balance.']);
        }

        $balance = $sms->remoteBalance($gateway);
        if ($balance === null) {
            return response()->json(['message' => 'Reve did not return a balance. Check the client id and balance URL.'], 422);
        }

        return response()->json(['data' => ['balance' => $balance]]);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(SmsGateway $gateway): array
    {
        return [
            'provider' => $gateway->provider,
            'is_enabled' => $gateway->is_enabled,
            'is_configured' => $gateway->isConfigured(),
            'live' => config('services.sms.driver') === 'reve',
            'api_url' => $gateway->api_url,
            'balance_url' => $gateway->balance_url,
            'api_key' => SmsGateway::mask($gateway->api_key),
            'secret_key' => SmsGateway::mask($gateway->secret_key),
            'sender_id' => $gateway->sender_id,
            'client_id' => $gateway->client_id,
            'rate_paisa' => $gateway->rate_paisa,
            'balance' => $gateway->balance_paisa / 100,
            'sms_left' => $gateway->smsLeft(),
            'low_balance' => $gateway->low_balance_paisa / 100,
            'low_alert_sent_at' => $gateway->low_alert_sent_at?->toIso8601String(),
        ];
    }
}
