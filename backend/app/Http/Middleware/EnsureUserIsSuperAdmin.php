<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Registered as the "super-admin" middleware alias.
 *
 * Guards features that are never part of a role's permission matrix and therefore can't be
 * delegated to another role — e.g. the SMS gateway credentials, SMS balance and SMS on/off switch.
 */
class EnsureUserIsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->is_active || ! $user->isSuperAdmin()) {
            return response()->json(['message' => 'Only a Super Admin can do this.'], 403);
        }

        return $next($request);
    }
}
