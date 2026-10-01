# XERQO API (Laravel backend)

REST API for the XERQO leather-goods store and admin panel.
Laravel 13 · MySQL · Sanctum personal access tokens (Bearer) · bcrypt passwords.

## Requirements

- PHP **8.3+** (Laravel 13 needs 8.3; XAMPP 8.2 is too old, use a PHP 8.3/8.4 build or Laragon 6+)
- PHP extensions: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo` (needed for image uploads), `zip`, `curl`
- Composer 2
- MySQL 5.7+/8 or MariaDB 10.4+ (the XAMPP and Laragon bundles both work)

## Setup on Windows (XAMPP / Laragon)

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

1. Start MySQL (XAMPP Control Panel or Laragon), then create an empty database named `xerqo`
   (phpMyAdmin → New → `xerqo`, collation `utf8mb4_unicode_ci`).
2. Check the DB settings in `.env` (the defaults suit XAMPP/Laragon: `root` with no password):
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=xerqo
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Build the tables, load the demo data, and start the API:
   ```powershell
   php artisan migrate --seed
   php artisan storage:link
   php artisan serve
   ```
   The API runs at **http://127.0.0.1:8000/api**.

To start over with fresh demo data, run `php artisan migrate:fresh --seed`.

### Default logins (password for all: `password`)

| Who | Login | Role |
|---|---|---|
| Admin | `dip@xerqo.com` | Super Admin |
| Staff | `rakib@xerqo.com`, `nasir@xerqo.com`, `sumaiya@xerqo.com` | Order Manager, Inventory, Support |
| Customer | `rahim@example.com` (or phone `01712345678`) | has pending + delivered orders |

**Change these passwords before you go live.**

## Connecting the React app

The Vite dev server already proxies `/api` to `http://127.0.0.1:8000`, so `npm run dev` works with no extra setup.
To call the API directly, or for a production build, set this in `frontend/.env`:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

CORS allows the origins listed in `FRONTEND_URL` in the backend `.env` (default `http://localhost:5173`; separate several origins with commas).

Auth flow: `POST /api/auth/login` returns `{ token, token_type: "Bearer", user }`. Store the token and send it as
`Authorization: Bearer <token>` (this is what `src/lib/api.js` does). The login field accepts an email **or** a mobile number,
so the frontend's `login(email, password)` helper works with phone numbers as well.

## Conventions

- All responses are JSON. Errors look like `{ "message": "...", "errors": { "field": ["..."] } }` (422 for validation, 401, 403, 404).
- List endpoints are paginated: `{ data: [...], links: {...}, meta: { current_page, last_page, total, ... } }`.
- Money values are numbers in BDT (৳). Order numbers look like `XQ-24817`.
- Phone numbers are normalised to `01XXXXXXXXX` (`+8801712-345678` is accepted too).
- **File uploads** use `multipart/form-data`. PHP does not parse multipart bodies on PUT, so send a
  `POST` with `_method=PUT` for updates that include files. Send booleans as `1`/`0`.
- Uploaded files are stored in `storage/app/public` and served from `APP_URL/storage/...`. Seeded images keep
  `/images/...` paths, which the React app serves from its `public/images` folder.
- Delivery charge: Inside Dhaka ৳60, Outside Dhaka ৳120, free from ৳2,000 subtotal. You can change these in the `delivery` setting.

## Endpoints

### Public
| Method | Path | Notes |
|---|---|---|
| GET | `/api/categories` | active categories with product counts |
| GET | `/api/products` | `category` (slug), `q`, `min_price`, `max_price`, `in_stock=1`, `engravable=1`, `sort=newest\|price_asc\|price_desc\|popular\|rating\|name`, `per_page`, `page` |
| GET | `/api/products/{slug}` | includes images, variants, rating, `related` |
| GET | `/api/products/{slug}/reviews` | approved reviews + `summary` (average, breakdown) |
| GET | `/api/banners` | `position=home_hero\|home_middle\|announcement` |
| GET | `/api/settings` | public settings (store, delivery, payments, returns, engraving) |
| POST | `/api/orders` | checkout for guests or logged-in customers (send the Bearer token to link the order to the account) |
| GET | `/api/orders/track?order_number=XQ-24817&phone=01712345678` | order tracking |
| POST | `/api/coupons/validate` | `{ code, subtotal }` or `{ code, items: [...] }`, optional `delivery_zone` |

Checkout body:
```json
{
  "name": "Rahim Uddin", "phone": "01712345678", "email": null,
  "district": "Dhaka", "area": "Dhanmondi", "address_line": "House 12, Road 5",
  "delivery_zone": "inside_dhaka", "payment_method": "cod",
  "coupon_code": "XERQO500", "note": "Call before delivery",
  "items": [{ "product_id": 1, "variant_id": 1, "qty": 1, "engraving_text": "M. HOSSAIN" }]
}
```
`delivery_zone` can be `inside_dhaka`/`outside_dhaka` (or `inside`/`outside`). If it is left out, it is worked out from the district.
`payment_method` is one of `cod`, `bkash`, `nagad`, `card`.
The order is created in one transaction that locks stock, checks it, and decrements it.

### Auth
| Method | Path | Body |
|---|---|---|
| POST | `/api/auth/register` | `name, phone, email?, password, password_confirmation` → token + user |
| POST | `/api/auth/login` | `email` (or `login`/`phone`) + `password` → token + user |
| POST | `/api/auth/forgot-password` | `identifier` (phone or email): sends a 6-digit OTP, valid 10 min, stored hashed |
| POST | `/api/auth/reset-password` | `identifier, otp, password, password_confirmation` |
| POST | `/api/auth/logout` | revokes the current token (auth) |

While `APP_DEBUG=true`, the forgot-password response also includes `debug_otp`, which helps with local testing.
SMS messages are written to `storage/logs/laravel.log` until you set up a gateway (`SMS_DRIVER=http`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID`, see `app/Services/SmsService.php`).

### Customer (Bearer token)
| Method | Path |
|---|---|
| GET / PUT | `/api/me` (name, phone, email, avatar) |
| PUT | `/api/me/password` (`current_password, password, password_confirmation`) |
| GET | `/api/me/orders`, `/api/me/orders/{order_number}` |
| GET / POST / GET / PUT / DELETE | `/api/me/addresses`, `/api/me/addresses/{id}` |
| GET / POST | `/api/me/wishlist` (`{ product_id }`) |
| DELETE | `/api/me/wishlist/{product_id}` |
| GET | `/api/me/reviews` (your reviews plus `to_review`: delivered items you have not reviewed yet) |
| POST | `/api/reviews` (`order_number, product_id, rating, title?, body?, photos[]?, delivery_rating?, courier_rating?, packaging_rating?`). Only allowed for products in your own **delivered** orders, one review per product per order. New reviews wait for admin approval. |
| GET | `/api/me/returns` |
| POST | `/api/returns` (`order_number, order_item_id, reason, resolution=refund\|exchange, qty?, details?, photos[]?`). Only for delivered orders, inside the return window (7 days by default). |

### Admin (Bearer token of a staff user, prefix `/api/admin`)
Each route checks the role's permission matrix: GET needs `view`, POST needs `create`, PUT/PATCH needs `edit`, DELETE needs `delete`.

| Method | Path | Module |
|---|---|---|
| GET | `/dashboard` | dashboard |
| GET | `/orders` (`status, payment_method, q, from, to`) | orders |
| GET / PUT | `/orders/{order_number}` (courier, tracking_code, payment_status, status, note) | orders |
| PATCH | `/orders/{order_number}/status` (`status, note?, courier?, tracking_code?`). Writes the status history, puts stock back on cancel/return, and sends SMS. | orders |
| CRUD | `/products`, `/products/{id}` (multipart `images[]`, `variants[]`) | products |
| POST | `/products/{id}/images` · PATCH `/products/{id}/images/reorder` · DELETE `/products/{id}/images/{imageId}` | products (edit) |
| CRUD | `/categories` (multipart `image`) | categories |
| GET | `/inventory` (`stock=low\|out`, `q`) | inventory |
| POST | `/inventory/adjust` (`product_id, variant_id?, type=set\|add\|subtract, quantity, reason?`) | inventory (edit) |
| GET | `/customers`, `/customers/{id}` | customers |
| GET | `/reviews` (`status, rating, product_id`) · PATCH `/reviews/{id}/approve` · PATCH `/reviews/{id}/reject` · DELETE `/reviews/{id}` | reviews |
| CRUD | `/coupons` | coupons |
| GET / GET / PUT | `/returns`, `/returns/{id}` (`status=approved\|rejected\|received\|completed`, `amount`, `admin_note`, `restock`) | returns |
| CRUD | `/staff` (users with a role) | staff |
| CRUD | `/roles` (`permissions: { "orders": ["view","edit"], ... }`). The response includes the module/action `matrix`. | staff |
| GET / PUT | `/settings` (`{ settings: { delivery: {...}, sms_templates: {...} } }`, merged into existing values) | settings |
| CRUD | `/banners` (multipart `image` or `image_url`) | content |

Permission modules: `dashboard, orders, returns, shipments, products, categories, inventory, customers, reviews, coupons, content, payments, reports, staff, settings`.
Actions: `view, create, edit, delete`. The Super Admin role always has full access.

## Seeded demo data

- 5 roles (Super Admin, Order Manager, Inventory, Support, Content Editor) with permission matrices
- 5 staff members and 7 customers, each with a default address
- 8 categories and 33 products that match `frontend/src/data/store.js` (same slugs, prices and `/images/...` paths), with colour variants on a few of them
- Coupons: `XERQO500` (৳500 off orders over ৳3,000), `WELCOME10` (10%, max ৳300), `EID15` (expired), `FREEGIFT` (inactive)
- 13 demo orders across every status, with status history, reviews (approved + pending) and return requests
- Settings: store info, delivery charges, payment methods, return policy, and SMS templates (including "Delivered + review request")
