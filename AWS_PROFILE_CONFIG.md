# ⚠️ CONFIGURACIÓN AWS - IMPORTANTE

Este proyecto utiliza el perfil **`agentcore-ws2`** de AWS CLI para todos los despliegues.

## 📋 Información del Perfil

- **Perfil AWS CLI**: `agentcore-ws2`
- **Cuenta AWS**: `972016405913`
- **Región**: `us-east-1` (Norte de Virginia)
- **Propósito**: Cuenta de pruebas/desarrollo

## 🚨 ADVERTENCIAS CRÍTICAS

### ❌ NO USAR EL PERFIL DEFAULT
El perfil `default` de AWS CLI está configurado para la cuenta de **PRODUCCIÓN en Europa** y **NO debe usarse** para este proyecto.

### ✅ SIEMPRE USAR agentcore-ws2
Todos los comandos AWS deben incluir explícitamente:
```bash
--profile agentcore-ws2 --region us-east-1
```

## 🔧 Configuración del Perfil

Si el perfil no está configurado, ejecuta:

```bash
aws configure --profile agentcore-ws2
```

Ingresa las credenciales cuando se soliciten:
- AWS Access Key ID: [Tu Access Key]
- AWS Secret Access Key: [Tu Secret Key]
- Default region name: `us-east-1`
- Default output format: `json`

## ✅ Verificar Configuración

Antes de cualquier despliegue, verifica que estás usando el perfil correcto:

```bash
export AWS_PROFILE=agentcore-ws2
aws sts get-caller-identity
```

Debes ver:
```json
{
    "UserId": "...",
    "Account": "972016405913",
    "Arn": "..."
}
```

Si ves una cuenta diferente, **DETENTE** y verifica tu configuración.

## 🚀 Comandos de Despliegue

### Opción 1: Usando el Script Automatizado (Recomendado)
```bash
cd infra
npm run cdk:deploy
```

El script `deploy.sh` automáticamente:
- ✅ Verifica el perfil AWS
- ✅ Valida la cuenta (972016405913)
- ✅ Construye las Lambda functions
- ✅ Ejecuta el bootstrap si es necesario
- ✅ Despliega el stack

### Opción 2: Comandos Manuales
```bash
cd infra

# Verificar perfil
export AWS_PROFILE=agentcore-ws2
aws sts get-caller-identity

# Bootstrap (solo primera vez)
npx cdk bootstrap aws://972016405913/us-east-1 --profile agentcore-ws2

# Build Lambdas
./build-lambdas.sh

# Deploy
npx cdk deploy --profile agentcore-ws2 --region us-east-1
```

## 🗑️ Eliminar Recursos

Para eliminar todos los recursos de AWS:

```bash
cd infra
npm run cdk:destroy
```

O manualmente:
```bash
npx cdk destroy --profile agentcore-ws2 --region us-east-1
```

## 📝 Comandos Cognito

### Crear Usuario Admin
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username admin@example.com \
  --temporary-password TempPassword123! \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --profile agentcore-ws2 \
  --region us-east-1
```

### Obtener Client Secret
```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-id <YOUR_CLIENT_ID> \
  --query 'UserPoolClient.ClientSecret' \
  --output text \
  --profile agentcore-ws2 \
  --region us-east-1
```

### Actualizar Callback URLs
```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-id <YOUR_CLIENT_ID> \
  --callback-urls "http://localhost:3000/api/auth/callback/cognito" \
  --logout-urls "http://localhost:3000" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --profile agentcore-ws2 \
  --region us-east-1
```

## 🔍 Monitoreo

### Ver Logs de Lambda
```bash
aws logs tail /aws/lambda/PollSystemStack-CreatePollFunction --follow \
  --profile agentcore-ws2 --region us-east-1
```

### Ver Stack en CloudFormation
```bash
aws cloudformation describe-stacks \
  --stack-name PollSystemStack \
  --profile agentcore-ws2 \
  --region us-east-1
```

### Listar Recursos
```bash
# DynamoDB Tables
aws dynamodb list-tables --profile agentcore-ws2 --region us-east-1

# Lambda Functions
aws lambda list-functions --profile agentcore-ws2 --region us-east-1

# API Gateway
aws apigatewayv2 get-apis --profile agentcore-ws2 --region us-east-1
```

## 📚 Referencias

- [AWS CLI Named Profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- Memoria del proyecto: Este proyecto usa el perfil `agentcore-ws2` según las memorias guardadas

## 🆘 Solución de Problemas

### Error: "Unable to locate credentials"
```bash
# Verificar que el perfil existe
aws configure list --profile agentcore-ws2

# Si no existe, configurarlo
aws configure --profile agentcore-ws2
```

### Error: "Access Denied" o cuenta incorrecta
```bash
# Verificar cuenta actual
export AWS_PROFILE=agentcore-ws2
aws sts get-caller-identity

# Si muestra una cuenta diferente, revisar ~/.aws/credentials
```

### Error: "Stack does not exist"
```bash
# Verificar que estás en la región correcta
aws cloudformation describe-stacks \
  --stack-name PollSystemStack \
  --profile agentcore-ws2 \
  --region us-east-1
```

---

**Recuerda**: Siempre verifica que estés usando `agentcore-ws2` antes de ejecutar cualquier comando de AWS. El script `deploy.sh` hace esta verificación automáticamente.

