# 🔧 Fix: Invalid Client Secret Error

## Problema

Error al hacer login:
```
"error": "invalid_client",
"error_description": "invalid_client_secret"
```

## Causa

El Cognito User Pool Client puede estar configurado para requerir un client secret, pero NextAuth está enviando `undefined` o una cadena vacía.

## Solución

### Opción 1: Regenerar el Client sin Secret (Recomendado)

Necesitamos actualizar el CDK stack para asegurar que el client NO requiere secret:

1. Actualizar `infra/lib/poll-system-stack.ts`:

```typescript
const userPoolClient = new cognito.UserPoolClient(this, 'PollSystemUserPoolClient', {
  userPool,
  authFlows: {
    userPassword: true,
    userSrp: true,
  },
  oAuth: {
    flows: {
      authorizationCodeGrant: true,
    },
    scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
    callbackUrls: [
      'http://localhost:3000/api/auth/callback/cognito',
      'https://your-vercel-app.vercel.app/api/auth/callback/cognito',
    ],
    logoutUrls: [
      'http://localhost:3000',
      'https://your-vercel-app.vercel.app',
    ],
  },
  generateSecret: false, // CRÍTICO: debe ser false
  preventUserExistenceErrors: true,
});
```

2. Redesplegar:
```bash
cd infra
npx cdk deploy --profile agentcore-ws2 --region us-east-1
```

### Opción 2: Obtener y Usar el Client Secret

Si el client tiene un secret, necesitamos obtenerlo y usarlo:

1. Obtener el secret desde AWS CLI:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_lsPzwW68F \
  --client-id 1r04111endgicjtsejidsod5ri \
  --profile agentcore-ws2 \
  --region us-east-1 \
  --query 'UserPoolClient.ClientSecret' \
  --output text
```

2. Actualizar `.env.local`:

```env
COGNITO_CLIENT_SECRET=el-secret-obtenido
```

3. Reiniciar el servidor Next.js

### Opción 3: Crear un Nuevo Client Manualmente

1. Ve a AWS Console → Cognito → User Pools → poll-system-admins
2. App Integration → App clients → Create app client
3. Configuración:
   - App type: **Public client** (sin secret)
   - App client name: poll-system-public-client
   - Authentication flows: **ALLOW_USER_SRP_AUTH**, **ALLOW_REFRESH_TOKEN_AUTH**
   - OAuth 2.0 grant types: **Authorization code grant**
   - OAuth scopes: **openid**, **email**, **profile**
   - Callback URLs: `http://localhost:3000/api/auth/callback/cognito`
   - Sign out URLs: `http://localhost:3000`
4. Copiar el nuevo Client ID
5. Actualizar `.env.local` con el nuevo Client ID

## Verificación

Para verificar si el client tiene secret:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_lsPzwW68F \
  --client-id 1r04111endgicjtsejidsod5ri \
  --profile agentcore-ws2 \
  --region us-east-1
```

Busca el campo `"ClientSecret"`. Si existe, necesitas usarlo en la Opción 2. Si no existe o si `"GenerateSecret": false`, entonces usa la Opción 1.

## Recomendación

**Usa la Opción 1**: Redesplegar el CDK con `generateSecret: false` garantiza que el client es público y no requiere secret, que es lo correcto para aplicaciones SPA y NextAuth.

---

**Fecha**: 23 de Noviembre, 2025

