# Deployment Guide

## Overview

This guide covers deploying the HardRock E-commerce Demo to:
- **Railway** (application hosting + MySQL database)
- **Cloudflare** (DNS management for demo.hardrock-co.com)

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare DNS                         │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ www.hardrock-co.com │    │   demo.hardrock-co.com      │ │
│  │ (existing site)     │    │   CNAME → Railway target    │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
              │                            │
              ▼                            ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│   Existing Railway      │    │   NEW Railway Project       │
│   Project (main site)   │    │   (hardrock-ecom-demo)      │
│                         │    │                             │
│   DO NOT TOUCH          │    │   ┌─────────────────────┐   │
│                         │    │   │  Laravel App        │   │
│                         │    │   └─────────────────────┘   │
│                         │    │   ┌─────────────────────┐   │
│                         │    │   │  MySQL Database     │   │
│                         │    │   └─────────────────────┘   │
└─────────────────────────┘    └─────────────────────────────┘
```

---

## Step 1: Railway Project Setup

### 1.1 Create New Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect to `mercenary19961/hardrock-ecom-demo`
5. Railway will detect the Laravel app automatically

### 1.2 Add MySQL Database

1. In your new Railway project, click **"+ New"**
2. Select **"Database" → "MySQL"**
3. Wait for provisioning (takes ~30 seconds)
4. Railway auto-creates these variables:
   - `MYSQL_URL`
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

### 1.3 Configure Environment Variables

In Railway project settings → Variables, add:

```env
# Application
APP_NAME="HardRock Demo Store"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://demo.hardrock-co.com

# Database (Railway auto-provides, but map to Laravel names)
DB_CONNECTION=mysql
DB_HOST=${MYSQLHOST}
DB_PORT=${MYSQLPORT}
DB_DATABASE=${MYSQLDATABASE}
DB_USERNAME=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}

# Session & Cache
SESSION_DRIVER=database
CACHE_DRIVER=database

# Generate this locally: php artisan key:generate --show
APP_KEY=base64:YOUR_GENERATED_KEY_HERE

# Optional: Mail (for order confirmations)
MAIL_MAILER=log
```

### 1.4 Configure Build & Start Commands

In Railway service settings:

**Build Command:**
```bash
composer install --no-dev --optimize-autoloader && npm ci && npm run build && php artisan config:cache && php artisan route:cache && php artisan view:cache
```

**Start Command:**
```bash
php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
```

### 1.5 Enable Public Networking

1. Go to your Laravel service in Railway
2. Click **"Settings"** tab
3. Under **"Networking"**, click **"Generate Domain"**
4. Note the Railway-provided domain (e.g., `hardrock-ecom-demo-production.up.railway.app`)

---

## Step 2: Custom Domain Setup

### 2.1 Add Custom Domain in Railway

1. In Railway service settings → **"Networking"**
2. Click **"+ Custom Domain"**
3. Enter: `demo.hardrock-co.com`
4. Railway will show a **target hostname** like:
   ```
   demo.hardrock-co.com.railway.app
   ```
   **Copy this value** - you'll need it for Cloudflare

### 2.2 Create Cloudflare DNS Record

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select the `hardrock-co.com` domain
3. Go to **DNS → Records**
4. Click **"Add record"**

| Setting | Value |
|---------|-------|
| **Type** | `CNAME` |
| **Name** | `demo` |
| **Target** | `demo.hardrock-co.com.railway.app` (from Railway) |
| **Proxy status** | **DNS only (grey cloud)** ⚠️ |
| **TTL** | Auto |

**⚠️ IMPORTANT**: Keep proxy OFF (grey cloud) initially for Railway SSL verification.

### 2.3 Wait for SSL Certificate

1. Railway will automatically provision an SSL certificate
2. This typically takes 2-10 minutes
3. Check status in Railway: Settings → Networking → Custom Domain
4. Wait until status shows **"Certificate issued"**

### 2.4 Verify Deployment

```bash
# Test the domain
curl -I https://demo.hardrock-co.com

# Expected response:
# HTTP/2 200
# server: railway
# ...
```

---

## Step 3: Database Seeding (Production)

### Option A: Via Railway Shell

1. In Railway, click on your Laravel service
2. Click **"Shell"** tab (or use `railway run`)
3. Run:
   ```bash
   php artisan migrate --force
   php artisan db:seed --class=ProductionSeeder
   ```

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Run commands
railway run php artisan migrate --force
railway run php artisan db:seed --class=ProductionSeeder
```

---

## Step 4: Post-Deployment Checklist

- [ ] Site loads at https://demo.hardrock-co.com
- [ ] SSL certificate is valid (padlock icon)
- [ ] Admin login works: admin@hardrock-co.com / demo1234
- [ ] Product images display correctly
- [ ] Cart functionality works
- [ ] Checkout flow completes
- [ ] Main site https://www.hardrock-co.com still works (no changes)

---

## Environment Variables Reference

### .env.example

```env
APP_NAME="HardRock Demo Store"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hardrock_ecom_demo
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_DRIVER=database

FILESYSTEM_DISK=local

MAIL_MAILER=log
MAIL_FROM_ADDRESS="demo@hardrock-co.com"
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
```

### Production Variables (Railway)

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_ENV` | `production` | Required |
| `APP_DEBUG` | `false` | Security |
| `APP_URL` | `https://demo.hardrock-co.com` | Required |
| `APP_KEY` | `base64:...` | Generate locally |
| `DB_CONNECTION` | `mysql` | |
| `DB_HOST` | `${MYSQLHOST}` | Railway reference |
| `DB_PORT` | `${MYSQLPORT}` | Railway reference |
| `DB_DATABASE` | `${MYSQLDATABASE}` | Railway reference |
| `DB_USERNAME` | `${MYSQLUSER}` | Railway reference |
| `DB_PASSWORD` | `${MYSQLPASSWORD}` | Railway reference |
| `SESSION_DRIVER` | `database` | Persistent sessions |
| `CACHE_DRIVER` | `database` | Or `redis` if added |

---

## Troubleshooting

### Domain Not Resolving

```bash
# Check DNS propagation
dig demo.hardrock-co.com

# Should show CNAME pointing to Railway
```

### SSL Certificate Issues

1. Ensure Cloudflare proxy is **OFF** (grey cloud)
2. Wait 10+ minutes for propagation
3. Check Railway logs for certificate errors
4. Try removing and re-adding the custom domain

### 500 Errors

```bash
# Check Railway logs
railway logs

# Common fixes:
# - Missing APP_KEY
# - Database connection issues
# - Missing migrations
```

### Storage/Images Not Working

```bash
# Ensure storage is linked
railway run php artisan storage:link

# For Railway, consider using S3 or Cloudinary for production images
```

---

## Enabling Cloudflare Proxy (Optional)

Once everything works with DNS-only:

1. Go to Cloudflare DNS settings
2. Click the grey cloud next to `demo` record
3. Toggle to **Proxied** (orange cloud)

Benefits:
- DDoS protection
- Caching for static assets
- Additional SSL layer

**Note**: Test thoroughly after enabling proxy.
