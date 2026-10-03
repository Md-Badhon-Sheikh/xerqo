<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\OtpCode;
use App\Models\PasswordResetOtp;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Daily housekeeping (scheduled in routes/console.php).
 */
class Cleanup extends Command
{
    protected $signature = 'xerqo:cleanup';

    protected $description = 'Delete expired sign-in codes, old read notifications, unused sessions and year-old activity';

    public function handle(): int
    {
        $counts = [
            'sign-in codes' => OtpCode::where('expires_at', '<', now()->subDay())->delete(),
            'reset codes' => PasswordResetOtp::where('expires_at', '<', now()->subDay())->delete(),
            'read notifications' => DB::table('notifications')->whereNotNull('read_at')->where('read_at', '<', now()->subDays(90))->delete(),
            'sessions unused for 60 days' => PersonalAccessToken::where(fn ($q) => $q->where('last_used_at', '<', now()->subDays(60))
                ->orWhere(fn ($q) => $q->whereNull('last_used_at')->where('created_at', '<', now()->subDays(60))))->delete(),
            'activity older than a year' => ActivityLog::where('created_at', '<', now()->subYear())->delete(),
            'failed queue jobs over 30 days old' => DB::table('failed_jobs')->where('failed_at', '<', now()->subDays(30))->delete(),
        ];

        foreach ($counts as $what => $n) {
            $this->line(str_pad((string) $n, 6, ' ', STR_PAD_LEFT)."  {$what}");
        }

        return self::SUCCESS;
    }
}
