<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Validation\Rule;

/**
 * The signed-in staff member's alerts (the bell) and which ones they want.
 */
class NotificationController extends Controller
{
    private const CATEGORIES = ['orders', 'reviews', 'returns', 'stock', 'system'];

    /**
     * GET /api/admin/notifications?category=&unread=1&page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['category' => ['nullable', Rule::in(self::CATEGORIES)]]);
        $user = $request->user();

        $page = $user->notifications()
            ->when($request->filled('category'), fn ($q) => $q->where('data->category', $request->input('category')))
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->paginate(min($request->integer('per_page', 20), 50));

        $counts = $user->notifications()->get(['data'])->countBy(fn ($n) => $n->data['category'] ?? 'system');

        return response()->json([
            'data' => $page->getCollection()->map(fn (DatabaseNotification $n) => [
                'id' => $n->id,
                ...$n->data,
                'read' => $n->read_at !== null,
                'created_at' => $n->created_at?->toIso8601String(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'from' => $page->firstItem(), 'to' => $page->lastItem(), 'total' => $page->total()],
            'counts' => [...array_fill_keys(self::CATEGORIES, 0), ...$counts->all(), 'all' => $counts->sum()],
            'unread' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * POST /api/admin/notifications/read {"ids": ["…"]} — mark these (or all, without ids) as read.
     */
    public function read(Request $request): JsonResponse
    {
        $data = $request->validate(['ids' => ['nullable', 'array', 'max:100'], 'ids.*' => ['string']]);

        $request->user()->unreadNotifications()
            ->when(! empty($data['ids']), fn ($q) => $q->whereIn('id', $data['ids']))
            ->update(['read_at' => now()]);

        return response()->json(['unread' => $request->user()->unreadNotifications()->count()]);
    }

    /**
     * DELETE /api/admin/notifications/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->whereKey($id)->delete();

        return response()->json(['message' => 'Dismissed.']);
    }

    /**
     * GET /api/admin/notifications/preferences
     */
    public function preferences(Request $request): JsonResponse
    {
        return response()->json(['data' => AdminNotifier::preferencesFor($request->user()->load('role'))]);
    }

    /**
     * PUT /api/admin/notifications/preferences {"prefs": {"new_order": {"app": true, "email": false}, …}}
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prefs' => ['required', 'array'],
            'prefs.*.app' => ['required', 'boolean'],
            'prefs.*.email' => ['required', 'boolean'],
        ]);

        $prefs = array_intersect_key($data['prefs'], AdminNotifier::EVENTS);
        $user = $request->user();
        $user->update(['notification_prefs' => [...($user->notification_prefs ?? []), ...$prefs]]);

        return response()->json(['data' => AdminNotifier::preferencesFor($user->load('role'))]);
    }
}
