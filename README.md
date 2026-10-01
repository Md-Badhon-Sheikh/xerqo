# XERQO — Leather Goods E-commerce

Responsive static design (React + Tailwind CSS) and a Laravel REST API backend.

```
xerqo/
├── frontend/   React 19 + Vite + Tailwind CSS v4 + React Router  (storefront + admin panel UI)
└── backend/    Laravel 13 REST API + MySQL + Sanctum tokens (bcrypt passwords)
```

## Requirements
- Node.js 20+ (for the frontend)
- PHP 8.3+ with pdo_mysql, mbstring, openssl, fileinfo, zip; Composer 2; MySQL 8 / MariaDB 10.6+
  (Laragon, Herd or XAMPP with PHP 8.3+. Older XAMPP builds ship PHP 8.2, which Laravel 13 does not support.)

## 1. Frontend (static design)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```
- Storefront: `/`  ·  Admin panel: `/admin` (login screen: `/admin/login`)
- **All pages index: `/design`** — links to every storefront and admin page.
- Production build: `npm run build` (output in `frontend/dist`).
- Pages use mock data from `src/data/store.js` and `src/data/admin.js`. `src/lib/api.js` has the REST client to swap in live data.
- `/api` requests are proxied to `http://127.0.0.1:8000` by Vite in development.

## 2. Backend (Laravel API)
```bash
cd backend
composer install
copy .env.example .env        # macOS/Linux: cp .env.example .env
php artisan key:generate
# create an empty MySQL database named "xerqo" (user root, no password by default — edit .env if different)
php artisan migrate --seed
php artisan storage:link
php artisan serve             # http://127.0.0.1:8000/api
```
Default logins after seeding (change before going live):
- Admin: `dip@xerqo.com` / `password`
- Customer: `rahim@example.com` / `password`

See `backend/README.md` for the full endpoint list.

## Structure (frontend)
```
src/
├── components/store/   StoreLayout (header, footer, bottom nav, mini cart, scroll-top, chat), ui kit, AccountShell
├── components/admin/   AdminLayout (sidebar / rail / mobile tabs, SettingsShell), admin ui kit
├── pages/store/        21 storefront pages
├── pages/admin/        27 admin pages
├── data/               mock data
└── lib/api.js          REST client for the Laravel API
```
Breakpoints: mobile < 640px, tablet 640–1023px, laptop 1024–1279px, desktop 1280px+.
