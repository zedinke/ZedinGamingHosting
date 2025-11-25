#!/bin/bash

# .env.example fájl létrehozása

cat > .env.example << 'EOF'
# ============================================
# ADATBÁZIS (Hestia CP által kezelt)
# ============================================
# PostgreSQL példa:
DATABASE_URL="postgresql://zedingaming_user:JELSZÓ@localhost:5432/zedingaming"

# MySQL/MariaDB példa (ha MySQL-t használsz a Hestia CP-ben):
# DATABASE_URL="mysql://zedingaming_user:JELSZÓ@localhost:3306/zedingaming"

# ============================================
# NEXTAUTH konfiguráció
# ============================================
# A domain címed (production-ben használd a https:// protokollt)
NEXTAUTH_URL="https://zedgaminghosting.hu"

# Generáld le: openssl rand -base64 32
NEXTAUTH_SECRET="generald-le-egy-erős-secret-kulcsot-openssl-rand-base64-32-parancs-sal"

# ============================================
# Email beállítások (Hestia CP SMTP)
# ============================================
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@zedgaminghosting.hu
SMTP_PASSWORD=email-jelszó-itt
SMTP_FROM=noreply@zedgaminghosting.hu

# ============================================
# Stripe (Fizetési rendszer - opcionális)
# ============================================
# Fejlesztéshez használd a test kulcsokat:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production-hez (ha készen állsz):
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...

# ============================================
# OAuth beállítások (opcionális)
# ============================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# ============================================
# Opcionális beállítások
# ============================================
# Port beállítás (ha nem 3000-et szeretnél használni)
# PORT=3000

# Node környezet
# NODE_ENV=production
EOF

echo ".env.example fájl létrehozva!"
echo "Most futtasd: cp .env.example .env"

