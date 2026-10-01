<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    /**
     * GET /api/admin/customers?q=&per_page=
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $customers = User::customers()
            ->withCount('orders')
            ->withSum(['orders' => fn ($q) => $q->whereNotIn('status', ['cancelled', 'returned'])], 'total')
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.trim((string) $request->input('q')).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('phone', 'like', $term));
            })
            ->latest()
            ->paginate(min($request->integer('per_page', 20), 100))
            ->withQueryString();

        return UserResource::collection($customers);
    }

    /**
     * GET /api/admin/customers/{id}
     */
    public function show(User $customer): UserResource
    {
        abort_if($customer->isStaff(), 404);

        $customer->loadCount('orders')
            ->loadSum(['orders' => fn ($q) => $q->whereNotIn('status', ['cancelled', 'returned'])], 'total');

        $orders = $customer->orders()->withCount('items')->latest()->limit(20)->get();

        return (new UserResource($customer))->additional([
            'orders' => OrderResource::collection($orders),
            'addresses' => AddressResource::collection($customer->addresses),
            'reviews_count' => $customer->reviews()->count(),
        ]);
    }
}
