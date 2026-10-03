<?php

use Illuminate\Support\Facades\Schedule;

/*
 * Runs from one cPanel cron line every minute:
 *   * * * * * cd /home/USER/xerqo && php artisan schedule:run >> /dev/null 2>&1
 */

// queued emails (order emails, invites, alerts) — shared hosting has no long-running worker
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3 --backoff=30')
    ->everyMinute()
    ->withoutOverlapping(5);

// old codes, read alerts, stale sessions, year-old activity
Schedule::command('xerqo:cleanup')->dailyAt('03:30');
