# XERQO — Leather Goods E-commerce

A single-brand online shop for Bangladesh: React storefront + admin panel on a Laravel REST API.

```
xerqo/
├── frontend/   React 19 + Vite + Tailwind CSS v4 + React Router + TanStack Query (storefront + admin)
├── backend/    Laravel 13 REST API + MySQL + Sanctum tokens
└── deploy/     files for cPanel's public_html (see DEPLOYMENT.md)
```

**What's in it:** catalogue with colour variants, flash sales, coupons and banners · customer accounts
with SMS-code sign-in · checkout with COD, bKash, Nagad, Rocket and bank transfer (manual verification)
· order, shipping, payment and return management · reviews with replies and delivery feedback ·
Reve SMS with a prepaid SMS wallet and SMS log · order emails over SMTP · staff roles and permissions,
activity log, staff alerts · accounts (income, refunds, expenses, profit) and sales reports.

## Requirements
- Node.js 20+
- PHP 8.3+ with pdo_mysql, mbstring, openssl, fileinfo, zip; Composer 2; MySQL 8 / MariaDB 10.6+

## Run it locally

```bash
# API
cd backend
composer install
copy .env.example .env        # macOS/Linux: cp .env.example .env
php artisan key:generate
# create an empty MySQL database named "xerqo" (edit DB_* in .env if needed)
php artisan migrate --seed    # demo catalogue, orders, staff and customers
php artisan storage:link
php artisan serve             # http://127.0.0.1:8000/api

# Shop + admin (second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173 — /api is proxied to :8000
```

Demo logins after seeding (password `password` for all):

| | |
|---|---|
| Super Admin | `dip@xerqo.com` |
| Admin | `admin@xerqo.com` |
| Customer | `rahim@example.com` or `01712345678` |

Locally `SMS_DRIVER=log` and `MAIL_MAILER=log`: SMS and emails are written to
`backend/storage/logs/laravel.log` instead of being sent (SMS still use the demo SMS balance),
and sign-in codes are also shown on screen while `APP_DEBUG=true`.

Tests: `cd backend && php artisan test`.

## Going live

See **[DEPLOYMENT.md](DEPLOYMENT.md)** — cPanel shared hosting, step by step.

## Frontend structure
```
src/
├── components/store/   StoreLayout (header, footer, bottom nav, mini cart, chat), ui kit, AccountShell
├── components/admin/   AdminLayout (sidebar, badges, SettingsShell), form + ui kit, DateRange
├── components/common/  Select2 wrapper, guards, password reset hook
├── pages/store/        storefront pages
├── pages/admin/        admin pages
├── context/            auth (customer + admin), cart, wishlist, compare
└── lib/                api client, queries, SweetAlert helpers, SMS counter
```
Every dropdown uses Select2 and every alert/confirmation uses SweetAlert2.
Breakpoints: mobile < 640px, tablet 640–1023px, laptop 1024–1279px, desktop 1280px+.
