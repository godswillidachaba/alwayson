# Deploy — AlwaysOn (Hostinger)

## Pre-deploy checklist

- [ ] `.env` has production values (debug=false, app_url correct, bcrypt=10, file sessions/cache)
- [ ] Config is cached: `php artisan config:cache`
- [ ] Routes are cached: `php artisan route:cache`
- [ ] Views are cached: `php artisan view:cache`
- [ ] Frontend is built: `npm run build`
- [ ] All assets exist in `public_html/assets/` (hero images, thumbnails, OG image, logos)
- [ ] Migration files are final (no dangling `ALTER TABLE` migrations)

## Deploy steps

Run these **on Hostinger** in order:

```bash
# 1. Upload all changed files (PHP, JS, assets)

# 2. Fresh database — creates all tables + seeds in one pass
php artisan migrate:fresh --seed

# 3. Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Build frontend
npm run build

# 5. Ensure storage directories are writable
chmod -R 775 storage/framework/sessions/
chmod -R 775 storage/framework/cache/data/

# 6. Purge Cloudflare cache (if applicable)
```

## First-time setup (new dev machine)

```bash
composer setup
```

This runs: deps install → `.env` copy → key generate → migrate → npm install → build.

## Manual fresh start

```bash
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
npm install && npm run build
```

## Verify deployment

| Check | How |
|---|---|
| Welcome page loads | `curl -I https://wearealwayson.com` (expect 200) |
| Apply form loads | Visit `/apply` |
| Login + dashboard | Submit application, check dashboard loads |
| KYC upload | Upload utility bill in address verification step |
| Admin KYC review | Login as admin, verify billing address + document display |
| Image assets | Hero image loads (WebP in modern browsers, JPEG fallback) |
| Console errors | Open DevTools — expect 0 errors |

## Rollback

```bash
# Revert to previous deployment by restoring old files
# If migration rollback is needed:
php artisan migrate:rollback --step=1
```

## Migration structure (collapsed)

The 13 migration files each create their table with **all columns and indexes inline** — no separate ALTER migrations.

| Table | Columns |
|---|---|
| `users` | id, name, email, role, phone, phone_verified_at, whatsapp_code, is_disabled, password, timestamps + indexes |
| `applications` | id, session_token, user_id, data, billing_address, current_step, building_type, selected_plan, monthly_*, status, assigned_sales_id, decline_*, deposit_*, esign_*, address_*, identity_*, timestamps + 5 indexes |
| `payments` | id, user_id, application_id, amount, reference, status, paid_at, timestamps + 4 indexes |
| `application_appliances` | id, application_id, appliance_key, label, watts_per_unit, quantity, timestamps + 1 index |
| `installer_tickets` | id, application_id, assigned_installer_id, status, started_at, notes, completion_*, completed_at, timestamps + 4 indexes |
| `kyc_documents` | id, application_id, type, file_path, notes, status, reviewed_by, reviewed_at, timestamps + 2 indexes |
| `installation_checklist_items` | id, installer_ticket_id, label, is_done, sort_order, timestamps + 1 index |
