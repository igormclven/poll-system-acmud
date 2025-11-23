# Deployment Guide

## Prerequisites

- AWS CLI configured with profile `agentcore-ws2` (cuenta de pruebas, región us-east-1)
- Node.js 20+
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Vercel CLI installed (`npm install -g vercel`)

**⚠️ ADVERTENCIA DE SEGURIDAD**: Este proyecto **DEBE** desplegarse usando el perfil `agentcore-ws2` de AWS CLI. El perfil `default` está configurado para producción en Europa y **NO debe usarse**. Todos los comandos AWS en esta guía incluyen `--profile agentcore-ws2`.

## Backend Deployment (AWS CDK)

### 1. Install Dependencies

```bash
cd infra
npm install
```

### 2. Build Lambda Functions

```bash
cd lambda/polls && npm run build
cd ../access-keys && npm run build
cd ../voting && npm run build
cd ../suggestions && npm run build
cd ../recurrence && npm run build
cd ../..
```

### 3. Bootstrap CDK (First time only)

```bash
# IMPORTANTE: Usar perfil agentcore-ws2
export AWS_PROFILE=agentcore-ws2

# Verificar que estás en la cuenta correcta (972016405913)
aws sts get-caller-identity

# Bootstrap CDK
cdk bootstrap aws://972016405913/us-east-1 --profile agentcore-ws2
```

### 4. Deploy Stack

```bash
# IMPORTANTE: Siempre usar el perfil agentcore-ws2
export AWS_PROFILE=agentcore-ws2
npm run cdk:deploy -- --profile agentcore-ws2

# O directamente:
npx cdk deploy --profile agentcore-ws2 --region us-east-1
```

This will create:
- DynamoDB Tables (Polls, PollInstances, AccessKeys, Votes, Suggestions)
- API Gateway HTTP API
- Lambda Functions
- Cognito User Pool
- EventBridge Scheduler

### 5. Note the Outputs

After deployment, note these outputs:
- `ApiEndpoint`: Your API Gateway endpoint
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito Client ID
- `Region`: AWS Region

### 6. Create Admin User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@example.com \
  --temporary-password TempPassword123! \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --profile agentcore-ws2 \
  --region us-east-1
```

## Frontend Deployment (Vercel)

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_CLIENT_ID
COGNITO_CLIENT_SECRET=YOUR_CLIENT_SECRET
COGNITO_ISSUER=https://cognito-idp.REGION.amazonaws.com/YOUR_USER_POOL_ID

NEXT_PUBLIC_API_URL=YOUR_API_GATEWAY_ENDPOINT
API_KEY=your-api-key-here
```

### 3. Test Locally

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Deploy to Vercel

```bash
vercel
```

Follow prompts and add environment variables in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add all variables from `.env.local`
- Redeploy

### 5. Update NEXTAUTH_URL

After deployment, update `NEXTAUTH_URL` to your Vercel domain:

```bash
vercel env add NEXTAUTH_URL production
# Enter: https://your-domain.vercel.app
```

Redeploy:

```bash
vercel --prod
```

## Post-Deployment Configuration

### 1. Configure Cognito Callback URLs

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --callback-urls "https://your-domain.vercel.app/api/auth/callback/cognito" "http://localhost:3000/api/auth/callback/cognito" \
  --logout-urls "https://your-domain.vercel.app" "http://localhost:3000" \
  --allowed-o-auth-flows "code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --profile agentcore-ws2 \
  --region us-east-1
```

### 2. Test the System

1. Visit your Vercel domain
2. Click "Admin Login"
3. Sign in with your Cognito credentials
4. Create a test poll
5. Generate access keys
6. Test voting with a key

## Cost Optimization

### Free Tier Usage (Monthly)
- **DynamoDB**: 25GB storage, 25 WCU, 25 RCU
- **Lambda**: 1M requests, 400,000 GB-seconds
- **API Gateway**: 1M requests
- **Cognito**: 50,000 MAUs
- **EventBridge**: 14.4M invocations
- **Vercel**: Hobby tier (unlimited bandwidth for personal projects)

### Cost Estimates (Beyond Free Tier)
- **DynamoDB On-Demand**: ~$0.25 per 1M read requests, ~$1.25 per 1M write requests
- **Lambda**: ~$0.20 per 1M requests + $0.0000166667 per GB-second
- **API Gateway HTTP API**: ~$1.00 per 1M requests
- **Data Transfer**: ~$0.09/GB (first 10TB/month)

For a poll system with 10,000 votes/month:
- Estimated cost: **$0.00 - $0.50/month** (within Free Tier)

## Monitoring

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/PollSystemStack-CreatePollFunction --follow \
  --profile agentcore-ws2 --region us-east-1

# View API Gateway logs (enable in console first)
aws logs tail /aws/apigateway/PollSystemApi --follow \
  --profile agentcore-ws2 --region us-east-1
```

### Metrics
```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=CreatePollFunction \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum \
  --profile agentcore-ws2 \
  --region us-east-1
```

## Troubleshooting

### Issue: "Unauthorized" when calling admin endpoints
- Verify Cognito token is being passed correctly
- Check API Gateway Cognito Authorizer configuration
- Ensure user is in the correct User Pool

### Issue: Votes not being recorded
- Check DynamoDB tables exist and have correct schemas
- Verify Lambda has IAM permissions to write to DynamoDB
- Check CloudWatch logs for errors

### Issue: Recurrence not working
- Verify EventBridge rule is enabled
- Check Lambda execution role has permissions
- Review CloudWatch logs for errors

## Cleanup

To remove all AWS resources:

```bash
cd infra
export AWS_PROFILE=agentcore-ws2
npx cdk destroy --profile agentcore-ws2 --region us-east-1
```

To remove Vercel deployment:

```bash
vercel rm your-project-name
```

