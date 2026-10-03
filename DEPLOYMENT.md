# Deploying XERQO to cPanel shared hosting

XERQO is two parts:

- **backend/** — Laravel API (PHP + MySQL). Lives **outside** the web root, in `/home/USER/xerqo`.
- **frontend/** — React app. Built into static files that go in `public_html`, together with a tiny
  `index.php` that hands `/api/...` requests to Laravel.

```
/home/USER/
├── xerqo/              ← everything from backend/ (with vendor/ and your .env)
└── public_html/        ← frontend/dist/* + deploy/public_html/index.php + deploy/public_html/.htaccess
```

`USER` is your cPanel username. Replace `xerqo.com` with your domain throughout.

---

## 1. What the hosting needs

| | |
|---|---|
| PHP | **8.3 or newer** (cPanel → *MultiPHP Manager* → pick 8.3/8.4 for the domain) |
| PHP extensions | `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `tokenizer`, `xml`, `ctype`, `bcmath`, `curl`, `zip` (cPanel → *Select PHP Version* → Extensions) |
| Database | MySQL 8 or MariaDB 10.6+ |
| Access | **Terminal** (cPanel → *Terminal*) or SSH is strongly recommended. Without it, run the Artisan commands below from your computer against the live database is not possible — ask the host to enable Terminal. |
| Mailbox | One domain email account, e.g. `hello@xerqo.com` (cPanel → *Email Accounts*) |

## 2. Build on your computer

```bash
# React app — uses frontend/.env.production (VITE_API_URL=/api)
cd frontend
npm ci
npm run build              # → frontend/dist/

# Laravel dependencies without dev tools
cd ../backend
composer install --no-dev --optimize-autoloader
```

## 3. Upload

1. **Laravel** → upload the contents of `backend/` to `/home/USER/xerqo/`
   (File Manager: zip `backend/`, upload, *Extract*). Do **not** upload `backend/.env`, `storage/logs/*` or `tests/`.
2. **React app** → upload the contents of `frontend/dist/` into `public_html/`.
3. From `deploy/public_html/` upload **`index.php`** and **`.htaccess`** into `public_html/`
   (File Manager → *Settings* → tick *Show Hidden Files* to see `.htaccess`).

If you named the Laravel folder something other than `xerqo`, edit the path near the top of `public_html/index.php`.

## 4. Database

cPanel → *MySQL Databases*:

1. Create a database, e.g. `USER_xerqo`.
2. Create a user with a strong password.
3. *Add User To Database* → **ALL PRIVILEGES**.

## 5. The `.env` file

```bash
cd ~/xerqo
cp .env.production.example .env
nano .env        # or edit it in File Manager
```

Fill in at least: `APP_URL`, `FRONTEND_URL`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`,
`PUBLIC_HTML_PATH=/home/USER/public_html`, and the `MAIL_*` values for your mailbox
(cPanel → *Email Accounts* → *Connect Devices* shows the SMTP server; port 465 = `MAIL_SCHEME=smtps`).

Keep `APP_DEBUG=false` on the live site.

## 6. First-time setup (Terminal)

```bash
cd ~/xerqo
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder --force   # roles + default settings (no demo data)
php artisan xerqo:create-admin                          # your Super Admin login
php artisan storage:link                                # creates public_html/storage
php artisan config:cache && php artisan route:cache && php artisan view:cache
chmod -R 775 storage bootstrap/cache
```

> Never run the plain `php artisan db:seed` on the live site — it adds demo products, orders and
> staff accounts whose password is `password`.

If `storage:link` fails (some hosts block symlinks) that's fine: uploaded photos are then served
through Laravel automatically.

If `php` points to an old version in Terminal, use the full path, e.g. `/opt/cpanel/ea-php83/root/usr/bin/php`.

## 7. Cron job (emails and clean-up)

Emails are queued, and shared hosting can't keep a worker running, so one cron job runs every minute.

cPanel → *Cron Jobs* → *Common Settings: Once Per Minute*, command:

```
cd /home/USER/xerqo && /opt/cpanel/ea-php83/root/usr/bin/php artisan schedule:run >> /dev/null 2>&1
```

It sends queued emails each minute and runs the nightly clean-up (old codes, read notifications,
unused sessions, year-old activity).

## 8. HTTPS

1. cPanel → *SSL/TLS Status* → run AutoSSL for the domain.
2. When `https://xerqo.com` loads, open `public_html/.htaccess` and uncomment the two
   *Force HTTPS* lines (and the `Strict-Transport-Security` header).

## 9. Check it works

- `https://xerqo.com/api/health` → `{"status":"ok","database":true,...}`
- `https://xerqo.com` → the shop; `https://xerqo.com/admin/login` → sign in with the Super Admin.

## 10. Set up the store in the admin

As the Super Admin:

1. **Settings → SMS & Notifications** — Reve API key, secret key, approved sender ID, price per SMS,
   then *Add balance*. Send a test SMS. (`SMS_DRIVER=reve` in `.env` sends for real.)
2. **Email notifications** (same page) — store inbox, then *Send test email*.
3. **Settings → Delivery & Payments** — delivery charges, bKash / Nagad / Rocket numbers, bank account.
4. **Settings → General** — store details, SEO, social links.
5. **Staff & Roles** — invite staff (they get an email to set their password).
6. Add categories, brands, products and banners.
7. Place a test order from a customer account and follow it through Orders → Shipping → Delivered.

## Updating the live site later

```bash
# on your computer
cd frontend && npm run build
cd ../backend && composer install --no-dev --optimize-autoloader
```

Upload the changed backend files to `~/xerqo` and the new `frontend/dist/*` to `public_html/`
(delete the old `public_html/assets/` first). Then in Terminal:

```bash
cd ~/xerqo
php artisan down
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan up
```

## Backups

- cPanel → *Backup* (or *JetBackup*): download the database and the home directory regularly.
- What must be kept: the database, `~/xerqo/.env`, and `~/xerqo/storage/app/public` (uploaded photos, slips, receipts).

## When something goes wrong

| Problem | Where to look |
|---|---|
| Blank page / 500 error | `~/xerqo/storage/logs/laravel-*.log`; check PHP is 8.3+ |
| Shop loads but nothing appears | `https://xerqo.com/api/health`; `.htaccess` uploaded? `index.php` path correct? |
| Product photos don't show | Run `php artisan storage:link`, or check `public_html/storage` |
| Emails don't arrive | Is the cron job running? `/api/health` shows `queued_jobs` piling up if not. Check `MAIL_*` and *Send test email* |
| SMS not sent | Admin → Settings → SMS: the SMS log shows the reason (switched off, low balance, Reve error) |
| Changed `.env` but nothing changed | `php artisan config:cache` again |
