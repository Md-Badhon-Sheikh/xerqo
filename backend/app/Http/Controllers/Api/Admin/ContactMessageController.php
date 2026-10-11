<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin → Messages: what customers sent from the Contact page.
 */
class ContactMessageController extends Controller
{
    /**
     * GET /api/admin/messages?status=unread|read&q=&page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['status' => ['nullable', 'in:unread,read'], 'q' => ['nullable', 'string', 'max:100']]);
        $q = trim((string) $request->input('q'));

        $page = ContactMessage::query()
            ->when($request->input('status') === 'unread', fn ($query) => $query->whereNull('read_at'))
            ->when($request->input('status') === 'read', fn ($query) => $query->whereNotNull('read_at'))
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")
                ->orWhere('phone', 'like', "%{$q}%")
                ->orWhere('order_number', 'like', "%{$q}%")
                ->orWhere('message', 'like', "%{$q}%")))
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => collect($page->items())->map->toAdminArray(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
            'counts' => ['all' => ContactMessage::count(), 'unread' => ContactMessage::whereNull('read_at')->count()],
        ]);
    }

    /**
     * PATCH /api/admin/messages/{message} {"read": true|false}
     */
    public function update(Request $request, ContactMessage $message): JsonResponse
    {
        $data = $request->validate(['read' => ['required', 'boolean']]);
        $message->update(['read_at' => $data['read'] ? ($message->read_at ?? now()) : null]);

        return response()->json(['data' => $message->toAdminArray()]);
    }

    public function destroy(ContactMessage $message): JsonResponse
    {
        $message->delete();

        return response()->json(null, 204);
    }
}
