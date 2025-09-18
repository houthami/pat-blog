# Vercel Deployment Guide

## 🚀 Quick Setup

### Step 1: Set Up Database
Choose one of these options:

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel project dashboard
2. Click **"Storage"** tab
3. Click **"Create Database"** → **"Postgres"**
4. This automatically sets `DATABASE_URL` environment variable

#### Option B: Neon (Free PostgreSQL)
1. Go to [neon.tech](https://neon.tech) and create free account
2. Create a new database
3. Copy the connection string
4. Add to Vercel environment variables (see Step 2)

### Step 2: Set Environment Variables
Go to **Project Settings** → **Environment Variables** in Vercel dashboard:

#### Required Variables
```bash
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
NEXTAUTH_URL="https://your-deployment-url.vercel.app"
NEXTAUTH_SECRET="your-secure-32-byte-secret-key"
```

#### Optional Variables
```bash
# Rate Limiting (Recommended)
UPSTASH_REDIS_REST_URL="https://your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Email Service
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@yourdomain.com"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Step 3: Deploy
1. Push to your connected Git repository, or
2. Run `vercel --prod` from your terminal

### Step 4: Set Up Database
After first deployment with DATABASE_URL set:

1. **Run migrations:**
```bash
npx prisma migrate deploy
```

2. **Seed test users:**
```bash
npm run seed:users
```

This creates test accounts:
- **Admin:** admin@pastry.com / Admin123!
- **Editor:** editor@pastry.com / Editor123!
- **Viewer:** viewer@pastry.com / Viewer123!

## Troubleshooting

### Common Issues

1. **Prisma Client Error**:
   - The `postinstall` script automatically runs `prisma generate`
   - Ensure `DATABASE_URL` is set correctly

2. **Authentication Issues**:
   - Verify `NEXTAUTH_URL` matches your deployment URL
   - Ensure `NEXTAUTH_SECRET` is set and secure

3. **Rate Limiting**:
   - Redis is optional but recommended for production
   - Uses in-memory fallback if Redis is not configured

## Build Configuration

- TypeScript checking is disabled during build for faster deployments
- Linting is skipped during build
- Static generation is enabled for public pages