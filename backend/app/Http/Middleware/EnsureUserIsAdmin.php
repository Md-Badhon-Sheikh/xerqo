<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Registered as the "admin" middleware alias.
 *
 *   ->middleware('admin')          any active staff user (user with a role)
 *   ->middleware('admin:orders')   staff whose role allows the action on the "orders" module;
 *                                  the action is derived from the HTTP method
 *                                  (GET => view, POST => create, PUT/PATCH => edit, DELETE => delete)
 *   ->middleware('admin:orders,edit')  explicit action
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next, ?string $module = null, ?string $action = null): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! $user->is_active || ! $user->isStaff()) {
            return response()->json(['message' => 'You do not have access to the admin panel.'], 403);
        }

        if ($module !== null) {
            $action ??= match ($request->method()) {
                'GET', 'HEAD', 'OPTIONS' => 'view',
                'POST' => 'create',
                'PUT', 'PATCH' => 'edit',
                'DELETE' => 'delete',
                default => 'view',
            };

            if (! $user->hasPermission($module, $action)) {
                return response()->json([
                    'message' => "Your role does not allow \"{$action}\" on {$module}.",
                ], 403);
            }
        }

        return $next($request);
    }
}
