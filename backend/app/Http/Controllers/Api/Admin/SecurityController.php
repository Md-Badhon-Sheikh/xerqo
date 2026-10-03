<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\Activity;
use App\Support\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Settings → Security: the staff activity log and every staff device that is signed in.
 */
class SecurityController extends Controller
{
    /**
     * GET /api/admin/security/activity?user_id=&category=&q=&from=&to=&page=
     */
    public function activity(Request $request): JsonResponse
    {
        $request->validate([
            'category' => ['nullable', Rule::in(ActivityLog::CATEGORIES)],
            'user_id' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $page = ActivityLog::with('user:id,name,role_id', 'user.role:id,name')
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->input('category')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('q'), fn ($q) => $q->where('description', 'like', '%'.$request->input('q').'%'))
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->date('from')->startOfDay()))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->date('to')->endOfDay()))
            ->latest('id')
            ->paginate(min($request->integer('per_page', 25), 200));

        return response()->json([
            'data' => $page->getCollection()->map(fn (ActivityLog $a) => [
                'id' => $a->id,
                'user' => $a->user?->name ?? 'System',
                'role' => $a->user?->role?->name,
                'action' => $a->action,
                'category' => $a->category,
                'description' => $a->description,
                'ip' => $a->ip,
                'device' => $a->device,
                'failed' => $a->action === 'auth.login_failed',
                'created_at' => $a->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'from' => $page->firstItem(), 'to' => $page->lastItem(), 'total' => $page->total()],
            'staff' => User::staff()->orderBy('name')->get(['id', 'name']),
            'failed_logins_7d' => ActivityLog::where('action', 'auth.login_failed')->where('created_at', '>=', now()->subDays(7))->count(),
        ]);
    }

    /**
     * GET /api/admin/security/sessions — signed-in devices of every staff member.
     */
    public function sessions(Request $request): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        $staffIds = User::staff()->pluck('id');

        $tokens = PersonalAccessToken::where('tokenable_type', (new User)->getMorphClass())
            ->whereIn('tokenable_id', $staffIds)
            ->with('tokenable:id,name,email,role_id')
            ->latest('last_used_at')->latest('id')
            ->limit(100)->get();

        return response()->json([
            'data' => $tokens->map(fn (PersonalAccessToken $t) => [
                'id' => $t->id,
                'user' => $t->tokenable?->name,
                'user_id' => $t->tokenable_id,
                'device' => $t->device ?? 'Unknown device',
                'kind' => Device::kind($t->device),
                'ip' => $t->ip,
                'current' => $current instanceof PersonalAccessToken && $current->id === $t->id,
                'last_used_at' => ($t->last_used_at ?? $t->created_at)?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * DELETE /api/admin/security/sessions/{id} — sign one staff device out (Super Admin).
     * DELETE /api/admin/security/sessions — sign out every staff device except your own.
     */
    public function revoke(Request $request, ?int $id = null): JsonResponse
    {
        $current = $request->user()->currentAccessToken();
        $query = PersonalAccessToken::where('tokenable_type', (new User)->getMorphClass())
            ->whereIn('tokenable_id', User::staff()->pluck('id'))
            ->when($current instanceof PersonalAccessToken, fn ($q) => $q->whereKeyNot($current->id));

        if ($id !== null) {
            $query->whereKey($id);
        }

        $n = $query->delete();
        Activity::log('security.signout', 'auth', $id === null ? "Signed out all other staff devices ({$n})" : 'Signed out a staff device');

        return response()->json(['message' => $id === null ? "Signed out {$n} device".($n === 1 ? '' : 's').'.' : 'Device signed out.']);
    }
}
