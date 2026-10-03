<?php

/*
 * Laravel front controller for cPanel.
 * Copy this file into public_html/ (next to the React build). It runs the Laravel app that lives
 * OUTSIDE the web root, in /home/USER/xerqo — change XERQO_APP if you used another folder name.
 * Apache only sends /api/... (and /storage/... when no symlink exists) here; see .htaccess.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$app_dir = getenv('XERQO_APP') ?: dirname(__DIR__).'/xerqo';

if (file_exists($maintenance = $app_dir.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $app_dir.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $app_dir.'/bootstrap/app.php';

// public_path() should point here (public_html), not at xerqo/public
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
