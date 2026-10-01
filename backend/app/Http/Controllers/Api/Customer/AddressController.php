<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\AddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return AddressResource::collection(
            $request->user()->addresses()->orderByDesc('is_default')->latest()->get()
        );
    }

    public function store(AddressRequest $request): JsonResponse
    {
        $user = $request->user();

        $address = DB::transaction(function () use ($request, $user) {
            // The first address becomes the default automatically.
            $makeDefault = $request->boolean('is_default') || ! $user->addresses()->exists();

            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([
                ...$request->validated(),
                'is_default' => $makeDefault,
            ]);
        });

        return (new AddressResource($address))->response()->setStatusCode(201);
    }

    public function show(Request $request, Address $address): AddressResource
    {
        $this->ensureOwner($request, $address);

        return new AddressResource($address);
    }

    public function update(AddressRequest $request, Address $address): AddressResource
    {
        $this->ensureOwner($request, $address);

        DB::transaction(function () use ($request, $address) {
            if ($request->boolean('is_default')) {
                $request->user()->addresses()->whereKeyNot($address->id)->update(['is_default' => false]);
            }

            $address->update($request->validated());
        });

        return new AddressResource($address->fresh());
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->ensureOwner($request, $address);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $request->user()->addresses()->latest()->first()?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Address deleted.']);
    }

    private function ensureOwner(Request $request, Address $address): void
    {
        abort_unless((int) $address->user_id === (int) $request->user()->id, 404);
    }
}
