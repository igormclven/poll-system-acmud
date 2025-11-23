# 🔧 Cognito Domain Configuration Fixed

## Problem
The Cognito User Pool was missing a **domain**, which is required for the OAuth2 Hosted UI flow that NextAuth uses. This caused the error:
```
{"code":"BadRequest","message":"The server did not understand the operation that was requested.","type":"client"}
```

## Solution Implemented

### Backend Changes (CDK Stack)
1. **Added Cognito Domain** to the User Pool with a unique prefix.
2. **Configured OAuth callbacks** in the User Pool Client.
3. **Disabled client secret** (not needed for NextAuth with public clients).

### New CloudFormation Outputs
After redeployment, the following values were generated:

```
ApiEndpoint: https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
CognitoDomain: poll-system-972016405913
CognitoIssuer: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
Region: us-east-1
UserPoolClientId: 1r04111endgicjtsejidsod5ri (UPDATED)
UserPoolId: us-east-1_lsPzwW68F
```

## Frontend Configuration

### Updated `.env.local` File
Create or update `web/.env.local` with these values:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_lsPzwW68F
COGNITO_CLIENT_ID=1r04111endgicjtsejidsod5ri
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
COGNITO_DOMAIN=poll-system-972016405913

# API Gateway
NEXT_PUBLIC_API_URL=https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
API_KEY=to-be-configured
```

### Generate NEXTAUTH_SECRET
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## What's Different Now

### Before
- No Cognito domain configured
- OAuth flow couldn't initiate properly
- Error when clicking "Sign in with Cognito"

### After
- Cognito domain: `poll-system-972016405913.auth.us-east-1.amazoncognito.com`
- OAuth flow works correctly
- Users will see the Cognito Hosted UI for login

## OAuth Flow

1. User clicks "Sign in with Cognito"
2. Redirected to: `https://poll-system-972016405913.auth.us-east-1.amazoncognito.com/oauth2/authorize?...`
3. User logs in with credentials
4. Redirected back to: `http://localhost:3000/api/auth/callback/cognito`
5. NextAuth exchanges code for tokens
6. User is authenticated

## Admin Credentials

**IMPORTANT**: The previous admin user was created before the client ID changed. You need to create a new admin user OR update the existing user.

### Option 1: Create New Admin User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_lsPzwW68F \
  --username admin@pollsystem.com \
  --user-attributes Name=email,Value=admin@pollsystem.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS \
  --profile agentcore-ws2 \
  --region us-east-1
```

### Option 2: Use Existing Admin User
The existing user should still work:
- **Email**: admin@pollsystem.com
- **Password**: (The one you set after changing from `TempPassword123!`)

## Testing the Fix

1. Update your `web/.env.local` file with the new values above
2. Generate and add `NEXTAUTH_SECRET`
3. Restart your Next.js dev server:
   ```bash
   cd web
   npm run dev
   ```
4. Go to: `http://localhost:3000/auth/signin`
5. Click "Sign in with Cognito"
6. You should now see the Cognito Hosted UI login page

## Vercel Deployment

When deploying to Vercel, you need to:

1. **Update the CDK stack** with your Vercel URL in the `callbackUrls`:
   ```typescript
   callbackUrls: [
     'http://localhost:3000/api/auth/callback/cognito',
     'https://your-app.vercel.app/api/auth/callback/cognito', // Update this
   ],
   ```

2. **Add environment variables** in Vercel dashboard:
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `NEXTAUTH_SECRET` = (your generated secret)
   - `COGNITO_USER_POOL_ID` = `us-east-1_lsPzwW68F`
   - `COGNITO_CLIENT_ID` = `1r04111endgicjtsejidsod5ri`
   - `COGNITO_ISSUER` = `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F`
   - `NEXT_PUBLIC_API_URL` = `https://ao95xslnhf.execute-api.us-east-1.amazonaws.com`

3. **Redeploy the CDK stack** after updating the callback URLs

## Deployment Date
**Date**: November 23, 2025, 8:56 PM EST
**Stack Status**: ✅ Successfully deployed with Cognito Domain

