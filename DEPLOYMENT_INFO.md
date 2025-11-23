# 🎉 Backend Desplegado Exitosamente

## ✅ Información del Deployment

**Fecha**: 2025-11-23 20:56 EST (Updated with Cognito Domain)
**Stack**: PollSystemStack
**Región**: us-east-1
**Cuenta**: 972016405913 (agentcore-ws2)
**ARN**: arn:aws:cloudformation:us-east-1:972016405913:stack/PollSystemStack/1f770c60-c806-11f0-b8a9-0ebe04c2ca5f

## 🔗 Endpoints y Credenciales

### API Gateway
- **API Endpoint**: https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
- **Región**: us-east-1

### Cognito
- **User Pool ID**: us-east-1_lsPzwW68F
- **Client ID**: 1r04111endgicjtsejidsod5ri (UPDATED)
- **Client Secret**: (Not configured - not needed for NextAuth)
- **Issuer**: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
- **Cognito Domain**: poll-system-972016405913
- **Hosted UI URL**: https://poll-system-972016405913.auth.us-east-1.amazoncognito.com

### Usuario Admin Creado
- **Email**: admin@pollsystem.com
- **Username**: 24881498-6041-70b4-a125-6ff3ede7ea55
- **Password Temporal**: TempPassword123!
- **Estado**: FORCE_CHANGE_PASSWORD (deberás cambiar la contraseña al primer login)

## 🧪 Testing del Backend

### Test 1: Crear una Poll (Requiere autenticación)

Este endpoint requiere un token de Cognito. Para probarlo:

1. Primero debes autenticarte via frontend
2. O usar AWS CLI para obtener un token:

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_lsPzwW68F \
  --client-id 3ku16l1v9n2sm4vo9rv1scuakv \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@pollsystem.com,PASSWORD=TempPassword123! \
  --profile agentcore-ws2 \
  --region us-east-1
```

### Test 2: Obtener Detalles de una Poll (Público)

```bash
# Primero necesitamos crear una poll (ver Test 1)
# Luego obtener sus detalles:
curl https://ao95xslnhf.execute-api.us-east-1.amazonaws.com/poll/POLL_ID
```

## 📋 Variables de Entorno para el Frontend

Crea o actualiza `web/.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-generado-aqui

# Cognito
COGNITO_USER_POOL_ID=us-east-1_lsPzwW68F
COGNITO_CLIENT_ID=1r04111endgicjtsejidsod5ri
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
COGNITO_DOMAIN=poll-system-972016405913

# AWS Backend (PRIVADO - Solo servidor, NO usar NEXT_PUBLIC_)
AWS_API_URL=https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY=no-configurado-aun
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**⚠️ IMPORTANTE**: NO usar `NEXT_PUBLIC_API_URL`. Las URLs del backend deben ser privadas y solo accesibles desde el servidor mediante el patrón BFF (Backend for Frontend).

## 🚀 Próximos Pasos

1. ✅ Backend desplegado
2. ✅ Usuario admin creado
3. ✅ Cognito configurado
4. ⏳ Configurar frontend (tú te encargas)
5. ⏳ Probar flujo completo

## 🔍 Recursos Creados

### DynamoDB Tables
- Polls
- PollInstances
- AccessKeys
- Votes
- Suggestions

### Lambda Functions
- CreatePollFunction
- GetPollsFunction
- GetPollDetailsFunction
- GenerateKeysFunction
- VoteFunction
- GetResultsFunction
- SubmitSuggestionFunction
- ManageSuggestionsFunction
- RecurrenceFunction

### EventBridge
- WeeklyRecurrenceRule (Lunes 00:00 UTC)

### API Gateway Routes
**Públicas:**
- GET /poll/{pollId}
- POST /vote
- POST /suggestions
- GET /results/{pollInstanceId}

**Admin (Cognito Auth):**
- POST /admin/polls
- GET /admin/polls
- POST /admin/access-keys
- GET /admin/suggestions
- PUT /admin/suggestions

## 🛠️ Comandos Útiles

### Ver Logs de Lambda
```bash
aws logs tail /aws/lambda/PollSystemStack-CreatePollFunction* --follow \
  --profile agentcore-ws2 --region us-east-1
```

### Listar Tables de DynamoDB
```bash
aws dynamodb list-tables --profile agentcore-ws2 --region us-east-1
```

### Ver Items en una tabla
```bash
aws dynamodb scan --table-name Polls \
  --profile agentcore-ws2 --region us-east-1
```

## 🗑️ Eliminar Todo

Si necesitas eliminar todos los recursos:

```bash
cd infra
npm run cdk:destroy
```

---

**Estado**: ✅ Backend completamente funcional y listo para conectarse con el frontend

