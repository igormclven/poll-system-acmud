# 🔧 Frontend Environment Setup

## Quick Setup Guide

### 1. Create Environment File

Create `web/.env.local` with the following content:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=REPLACE_WITH_GENERATED_SECRET

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_lsPzwW68F
COGNITO_CLIENT_ID=1r04111endgicjtsejidsod5ri
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
COGNITO_DOMAIN=poll-system-972016405913

# AWS Backend Configuration (PRIVATE - Server-side only)
# ⚠️ IMPORTANTE: NO usar NEXT_PUBLIC_ para estas variables
AWS_API_URL=https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY=to-be-configured
```

### 2. Generate Secret

Run this command to generate your `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Copy the output and replace `REPLACE_WITH_GENERATED_SECRET` in your `.env.local` file.

### 3. Start Frontend

```bash
cd web
npm run dev
```

### 4. Test Authentication

1. Open: http://localhost:3000/auth/signin
2. Click "Sign in with Cognito"
3. You should see the Cognito Hosted UI
4. Log in with:
   - **Email**: admin@pollsystem.com
   - **Password**: TempPassword123! (or your changed password)

### 5. Access Admin Dashboard

After logging in, you should be redirected to: http://localhost:3000/admin

## 🔒 Seguridad: Backend for Frontend (BFF)

### ✅ Variables Privadas del Servidor

Las siguientes variables son **PRIVADAS** y solo existen en el servidor de Vercel/Next.js:

- `AWS_API_URL` - URL del backend AWS (nunca expuesta al cliente)
- `AWS_API_KEY` - API Key para autenticar requests (nunca expuesta al cliente)

### ❌ NO Usar NEXT_PUBLIC_

**NUNCA** agregues el prefijo `NEXT_PUBLIC_` a las variables del backend:

```env
# ❌ MAL - Expone la URL al cliente
NEXT_PUBLIC_API_URL=https://...

# ✅ BIEN - Privada en el servidor
AWS_API_URL=https://...
```

### 🛡️ Cómo Funciona

Todas las llamadas al backend pasan por las Next.js API Routes (`/app/api/*`):

1. **Cliente** → `fetch('/api/vote')` (URL local)
2. **Servidor** → Obtiene `AWS_API_URL` de variables de entorno
3. **Servidor** → Agrega API Key o Bearer Token
4. **Servidor** → `fetch(AWS_API_URL + '/vote')` con credenciales
5. **Servidor** → Retorna respuesta al cliente

**Resultado**: El cliente NUNCA conoce la URL del backend ni las credenciales.

Ver `BFF_IMPLEMENTATION.md` para más detalles.

## What Was Fixed

### Problem
The Cognito User Pool was missing a domain configuration, which is required for OAuth2 authentication flow.

### Solution
- Added Cognito domain: `poll-system-972016405913`
- Configured OAuth callback URLs
- Updated User Pool Client with proper OAuth settings
- Updated Client ID to: `1r04111endgicjtsejidsod5ri`

## Admin Credentials

**Email**: admin@pollsystem.com
**Initial Password**: TempPassword123!

On first login, you'll be forced to change the password.

## Troubleshooting

### Error: "Invalid state parameter"
- Clear your browser cookies
- Restart the Next.js dev server
- Try again

### Error: "Client authentication failed"
- Make sure `COGNITO_CLIENT_SECRET` is empty or not set
- Verify all environment variables are correct

### Error: "API URL not configured"
- Make sure `AWS_API_URL` is set in `.env.local`
- Restart the Next.js dev server

### Can't log in
- Check that the admin user exists in Cognito
- Verify the password (may have been changed)
- Check AWS console for user status

## Next Steps

Once you've successfully logged in:
1. Create a new poll using the admin dashboard
2. Generate access keys for voters
3. Test the voting flow
4. Check poll results

## For Production (Vercel)

When deploying to Vercel:

### 1. Update CDK Stack
Update the callback URLs in `infra/lib/poll-system-stack.ts`:

```typescript
callbackUrls: [
  'http://localhost:3000/api/auth/callback/cognito',
  'https://your-app.vercel.app/api/auth/callback/cognito', // Add your Vercel URL
],
```

### 2. Set Environment Variables in Vercel

Go to Vercel Dashboard → Settings → Environment Variables:

```
NEXTAUTH_URL = https://your-app.vercel.app
NEXTAUTH_SECRET = [your generated secret]
COGNITO_USER_POOL_ID = us-east-1_lsPzwW68F
COGNITO_CLIENT_ID = 1r04111endgicjtsejidsod5ri
COGNITO_ISSUER = https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
AWS_API_URL = https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY = [configure in AWS]
```

### 3. Redeploy Backend
```bash
cd infra
npm run cdk:deploy
```

### 4. Deploy Frontend
Push to your Git repository and Vercel will auto-deploy.

## Important Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Generate a strong `NEXTAUTH_SECRET`** for production
3. **Use different secrets** for development and production
4. **All backend URLs are hidden** thanks to BFF pattern

---

**Estado**: ✅ Frontend configurado con BFF seguro
**Fecha**: 23 de Noviembre, 2025


