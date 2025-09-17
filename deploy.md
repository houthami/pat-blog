# Deployment Guide - Neon PostgreSQL

## Prerequisites

1. **Neon Database Setup**
   - Create account at [neon.tech](https://neon.tech)
   - Create a new project
   - Get your connection string from the dashboard

## Environment Variables

Create or update your production environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-app-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

## Database Migration

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

3. **Deploy migrations to Neon**
   ```bash
   npm run prisma:migrate
   ```

## Deployment Platforms

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy**
   ```bash
   npm run build
   ```

### Railway

1. **Connect your repository to Railway**
2. **Add environment variables** in Railway dashboard
3. **Set build command**: `npm run build`
4. **Set start command**: `npm start`

### Netlify

1. **Build command**: `npm run build`
2. **Publish directory**: `.next`
3. **Add environment variables** in Netlify dashboard

## Production Checklist

- [ ] Database connection string configured
- [ ] NextAuth secret generated and set
- [ ] Domain configured in NextAuth URL
- [ ] Redis rate limiting configured (optional)
- [ ] SSL enabled (handled by Neon automatically)
- [ ] Environment variables secured
- [ ] Database migrations deployed
- [ ] Build successful
- [ ] Authentication working
- [ ] Recipe CRUD operations working

## Troubleshooting

### Common Issues

1. **Connection timeout**
   - Ensure DATABASE_URL includes `?sslmode=require`
   - Check Neon connection limits

2. **Migration errors**
   - Ensure database is empty for first deployment
   - Use `prisma db push` for development, `prisma migrate deploy` for production

3. **NextAuth errors**
   - Verify NEXTAUTH_URL matches your domain
   - Ensure NEXTAUTH_SECRET is set and secure

### Database Commands

```bash
# View database status
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset

# Apply pending migrations
npx prisma migrate deploy

# Generate client after schema changes
npx prisma generate
```