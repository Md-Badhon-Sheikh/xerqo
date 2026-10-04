<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Mail\OrderPlaced;
use App\Models\Order;
use App\Models\Setting;
use App\Models\SmsGateway;
use App\Models\SmsLog;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * SMS & email notifications for staff with the "settings" permission:
 * templates, delivery log, test messages and email switches.
 * The gateway keys and the wallet itself are Super Admin only (SmsGatewayController).
 */
class SmsController extends Controller
{
    /**
     * GET /api/admin/sms — wallet status (read-only here), this month's numbers, templates and email switches.
     */
    public function index(): JsonResponse
    {
        $gateway = SmsGateway::current();
        $month = SmsLog::where('created_at', '>=', now()->startOfMonth());

        return response()->json([
            'gateway' => [
                'is_enabled' => $gateway->is_enabled,
                'is_configured' => $gateway->isConfigured(),
                'live' => config('services.sms.driver') === 'reve',
                'sender_id' => $gateway->sender_id,
                'balance' => $gateway->balance_paisa / 100,
                'rate_paisa' => $gateway->rate_paisa,
                'sms_left' => $gateway->smsLeft(),
                'low_balance' => $gateway->balance_paisa < $gateway->low_balance_paisa,
            ],
            'stats' => [
                'sent_today' => (int) SmsLog::where('status', SmsLog::STATUS_SENT)->where('created_at', '>=', today())->sum('segments'),
                'sent_month' => (int) (clone $month)->where('status', SmsLog::STATUS_SENT)->sum('segments'),
                'cost_month' => (clone $month)->sum('cost_paisa') / 100,
                'not_sent_month' => (clone $month)->where('status', '!=', SmsLog::STATUS_SENT)->count(),
            ],
            'templates' => Setting::getValue('sms_templates', []),
            'email' => [
                ...$this->emailSettings(),
                'from' => config('mail.from.address'),
                'mailer' => config('mail.default'),
            ],
        ]);
    }

    /**
     * GET /api/admin/sms/logs?status=sent|failed|skipped&q=017…&page=
     */
    public function logs(Request $request): JsonResponse
    {
        $request->validate([
            'status' => ['nullable', Rule::in([SmsLog::STATUS_SENT, SmsLog::STATUS_FAILED, SmsLog::STATUS_SKIPPED, SmsLog::STATUS_TEST])],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $logs = SmsLog::query()
            ->with('user:id,name')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->q, fn ($q, $term) => $q->where(fn ($w) => $w->where('phone', 'like', "%{$term}%")->orWhere('message', 'like', "%{$term}%")))
            ->latest('id')
            ->paginate(min(50, (int) $request->input('per_page', 20)));

        return response()->json([
            'data' => $logs->getCollection()->map(fn (SmsLog $log) => [
                'id' => $log->id,
                'phone' => $log->phone,
                'message' => $log->message,
                'template' => $log->template,
                'template_name' => $log->template ? Setting::getValue("sms_templates.{$log->template}.name", $log->template) : null,
                'encoding' => $log->encoding,
                'segments' => $log->segments,
                'cost' => $log->cost_paisa / 100,
                'status' => $log->status,
                'reason' => $log->reason,
                'sent_by' => $log->user?->name,
                'created_at' => $log->created_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * PUT /api/admin/sms/templates/{key} {"enabled": true, "body": "Hi {name} …"}
     */
    public function updateTemplate(Request $request, string $key): JsonResponse
    {
        $templates = Setting::getValue('sms_templates', []);
        abort_unless(isset($templates[$key]), 404, 'Unknown SMS template.');

        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'body' => ['required', 'string', 'max:670'], // 10 Bangla parts at most
        ]);

        $templates[$key] = [...$templates[$key], ...$data];
        Setting::setValue('sms_templates', $templates);

        return response()->json(['data' => $templates[$key]]);
    }

    /**
     * POST /api/admin/sms/test {"phone": "017…", "template": "order_confirmed"} or {"phone", "message"}
     * Sends a real (charged) SMS; template placeholders are filled with sample values.
     */
    public function test(Request $request, SmsService $sms): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'regex:/^01[3-9]\d{8}$/'],
            'template' => ['required_without:message', 'nullable', 'string'],
            'message' => ['required_without:template', 'nullable', 'string', 'max:670'],
        ], ['phone.regex' => 'Enter a Bangladeshi mobile number like 01712345678.']);

        $message = $data['message'] ?? null;
        if (! $message) {
            $body = Setting::getValue("sms_templates.{$data['template']}.body");
            if (! is_string($body) || $body === '') {
                throw ValidationException::withMessages(['template' => 'That template is empty.']);
            }
            $message = strtr($body, $this->sampleData());
        }

        $log = $sms->deliver($data['phone'], $message, $data['template'] ?? null, $request->user());

        if ($log->status !== SmsLog::STATUS_SENT) {
            return response()->json(['message' => 'SMS not sent: '.$log->reason.'.', 'data' => ['status' => $log->status]], 422);
        }

        return response()->json([
            'message' => "Test SMS sent to {$log->phone} ({$log->segments} SMS, ৳".number_format($log->cost_paisa / 100, 2).').',
            'data' => ['status' => $log->status, 'segments' => $log->segments, 'cost' => $log->cost_paisa / 100],
        ]);
    }

    /**
     * PUT /api/admin/sms/email {"customer_order": true, "customer_status": true, "admin_new_order": true, "admin_email": "orders@…"}
     */
    public function updateEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_order' => ['required', 'boolean'],
            'customer_status' => ['required', 'boolean'],
            'admin_new_order' => ['required', 'boolean'],
            'admin_email' => ['nullable', 'required_if:admin_new_order,true', 'email', 'max:255'],
        ], ['admin_email.required_if' => 'Enter the inbox that should get new-order emails.']);

        Setting::setValue('email_notifications', $data, 'notifications', false);

        return response()->json(['data' => $this->emailSettings()]);
    }

    /**
     * POST /api/admin/sms/email/test {"email": "me@…"} — sends a sample order email right away (not queued),
     * so SMTP problems show up immediately.
     */
    public function testEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);

        $order = Order::with('items')->latest('id')->first();
        if (! $order) {
            throw ValidationException::withMessages(['email' => 'Place at least one order first — the test email uses the latest order.']);
        }

        try {
            Mail::to($data['email'])->sendNow(new OrderPlaced($order));
        } catch (Throwable $e) {
            return response()->json(['message' => 'Email failed: '.$e->getMessage()], 422);
        }

        return response()->json(['message' => "Test email sent to {$data['email']}."]);
    }

    /**
     * @return array<string, mixed>
     */
    private function emailSettings(): array
    {
        return [
            'customer_order' => (bool) Setting::getValue('email_notifications.customer_order', true),
            'customer_status' => (bool) Setting::getValue('email_notifications.customer_status', true),
            'admin_new_order' => (bool) Setting::getValue('email_notifications.admin_new_order', true),
            'admin_email' => Setting::getValue('email_notifications.admin_email'),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function sampleData(): array
    {
        $frontend = rtrim((string) config('app.frontend_url'), '/');

        return [
            '{name}' => 'Rahim', '{order_id}' => 'XQ-24817', '{total}' => '2,600', '{amount}' => '2,600',
            '{courier}' => 'Steadfast', '{tracking_link}' => $frontend.'/track?order=XQ-24817', '{cod_amount}' => '2,600',
            '{product}' => 'Classic Bifold Wallet', '{review_link}' => $frontend.'/account/review/XQ-24817',
            '{reason}' => 'transaction ID not found', '{return_id}' => 'RT-1042', '{date}' => now()->addDay()->format('j M'),
            '{cart_link}' => $frontend.'/cart', '{otp}' => '482913', '{code}' => '482913', '{minutes}' => '5',
        ];
    }
}
