# OAuth Setup Guide

## Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

4. **Copy credentials to .env.local**
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

## Facebook OAuth Setup

1. **Go to Facebook Developers**
   - Visit [developers.facebook.com](https://developers.facebook.com)
   - Create a new app or select existing one

2. **Add Facebook Login Product**
   - In your app dashboard, click "Add Product"
   - Select "Facebook Login" and set it up

3. **Configure OAuth Settings**
   - Go to "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/facebook`
     - Production: `https://yourdomain.com/api/auth/callback/facebook`

4. **Get App Credentials**
   - Go to "Settings" > "Basic"
   - Copy App ID and App Secret

5. **Copy credentials to .env.local**
   ```env
   FACEBOOK_CLIENT_ID="your-facebook-app-id"
   FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
   ```

## Environment Variables

Add these to your `.env.local` file:

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/register`
3. Test registration with:
   - Email/password
   - Google OAuth
   - Facebook OAuth
4. Check that users are created with VIEWER role by default

## Production Setup

1. Update OAuth redirect URIs to use your production domain
2. Set production environment variables
3. Ensure NEXTAUTH_URL points to your production domain
4. Use a secure NEXTAUTH_SECRET (32+ characters)