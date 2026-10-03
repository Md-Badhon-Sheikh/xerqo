<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Customer segments for the admin, worked out from order history:
 * - risky:   blocked from COD, or at least 2 finished parcels and fewer than 60% of them delivered
 * - vip:     ৳10,000+ spent (orders that were not cancelled or returned)
 * - new:     no delivered order yet
 * - regular: everyone else
 */
class CustomerSegment
{
    public const SEGMENTS = ['vip', 'regular', 'new', 'risky'];

    public const VIP_SPEND = 10000;

    private const DELIVERED = "(select count(*) from orders o where o.user_id = users.id and o.status = 'delivered')";

    private const RETURNED = "(select count(*) from orders o where o.user_id = users.id and o.status = 'returned')";

    private const SPENT = "(select coalesce(sum(o.total), 0) from orders o where o.user_id = users.id and o.status not in ('cancelled', 'returned'))";

    /**
     * @param  array{cod_blocked: bool, delivered: int, returned: int, spent: float}  $c
     */
    public static function for(array $c): string
    {
        $finished = $c['delivered'] + $c['returned'];

        return match (true) {
            $c['cod_blocked'] || ($finished >= 2 && $c['delivered'] / $finished < 0.6) => 'risky',
            $c['spent'] >= self::VIP_SPEND => 'vip',
            $c['delivered'] === 0 => 'new',
            default => 'regular',
        };
    }

    /**
     * Delivered share of finished parcels (delivered + returned), or null before the first one finishes.
     */
    public static function successRate(int $delivered, int $returned): ?int
    {
        return $delivered + $returned > 0 ? (int) round($delivered / ($delivered + $returned) * 100) : null;
    }

    /**
     * Adds delivered_count, returned_count and spent to each row.
     */
    public static function withStats(Builder $query): Builder
    {
        return $query->addSelect([
            'users.*',
            DB::raw(self::DELIVERED.' as delivered_count'),
            DB::raw(self::RETURNED.' as returned_count'),
            DB::raw(self::SPENT.' as spent'),
        ]);
    }

    public static function filter(Builder $query, string $segment): Builder
    {
        $d = self::DELIVERED;
        $r = self::RETURNED;
        $risky = "(users.cod_blocked = 1 or ({$d} + {$r} >= 2 and {$r} * 100 > 40 * ({$d} + {$r})))";
        $vip = '('.self::SPENT.' >= '.self::VIP_SPEND.')';
        $new = "({$d} = 0)";

        return match ($segment) {
            'risky' => $query->whereRaw($risky),
            'vip' => $query->whereRaw("not {$risky} and {$vip}"),
            'new' => $query->whereRaw("not {$risky} and not {$vip} and {$new}"),
            'regular' => $query->whereRaw("not {$risky} and not {$vip} and not {$new}"),
            default => $query,
        };
    }
}
