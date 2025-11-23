# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 20+
- AWS Account (agentcore-ws2 profile - us-east-1)
- AWS CLI configured with profile `agentcore-ws2`

**⚠️ IMPORTANTE**: Este proyecto usa el perfil `agentcore-ws2` de AWS CLI (cuenta de pruebas en us-east-1). **NO uses el perfil default** que está en producción en Europa.

### 1. Clone and Install

```bash
cd /path/to/poll-system

# Install backend dependencies
cd infra && npm install

# Install all lambda dependencies
cd lambda/polls && npm install
cd ../access-keys && npm install
cd ../voting && npm install
cd ../suggestions && npm install
cd ../recurrence && npm install
cd ../../..

# Install frontend dependencies
cd web && npm install
cd ..
```

### 2. Deploy Backend to AWS

```bash
cd infra

# IMPORTANTE: Verificar que estás usando el perfil correcto
export AWS_PROFILE=agentcore-ws2
aws sts get-caller-identity  # Debe mostrar cuenta 972016405913

# First time only: Bootstrap CDK
npx cdk bootstrap --profile agentcore-ws2

# Deploy the stack
npm run cdk:deploy -- --profile agentcore-ws2

# Save the outputs:
# - ApiEndpoint
# - UserPoolId
# - UserPoolClientId
# - Region (debe ser us-east-1)
```

### 3. Create Admin User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username admin@example.com \
  --temporary-password TempPassword123! \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --profile agentcore-ws2 \
  --region us-east-1
```

### 4. Get Cognito Client Secret

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-id <YOUR_CLIENT_ID> \
  --query 'UserPoolClient.ClientSecret' \
  --output text \
  --profile agentcore-ws2 \
  --region us-east-1
```

### 5. Configure Frontend

```bash
cd web

# Create .env.local file
cat > .env.local << EOF
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

COGNITO_USER_POOL_ID=<YOUR_USER_POOL_ID>
COGNITO_CLIENT_ID=<YOUR_CLIENT_ID>
COGNITO_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
COGNITO_ISSUER=https://cognito-idp.<REGION>.amazonaws.com/<YOUR_USER_POOL_ID>

NEXT_PUBLIC_API_URL=<YOUR_API_ENDPOINT>
API_KEY=your-api-key-change-me
EOF
```

### 6. Update Cognito Callback URLs

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

### 7. Run Development Server

```bash
cd web
npm run dev
```

Visit http://localhost:3000

### 8. Test the System

1. **Go to Admin**: Click "Admin Login" → Sign in with Cognito credentials
2. **Create Poll**: 
   - Title: "Weekly Lunch Poll"
   - Options: "Pizza", "Sushi", "Tacos"
   - Check "Recurring Poll" and "Allow Suggestions"
3. **Generate Keys**: Click "Access Keys" → Generate 10 keys
4. **Vote**: Copy a voting URL and open in incognito window
5. **View Results**: Check the admin dashboard

## 📦 What's Included

### Backend (AWS CDK)
- ✅ 5 DynamoDB Tables (Polls, PollInstances, AccessKeys, Votes, Suggestions)
- ✅ 9 Lambda Functions (TypeScript)
- ✅ API Gateway HTTP API with Cognito Authorizer
- ✅ Cognito User Pool for admin authentication
- ✅ EventBridge Scheduler for weekly recurrence

### Frontend (Next.js)
- ✅ Homepage with navigation
- ✅ Public voting interface
- ✅ Admin dashboard with authentication
- ✅ Poll creation and management
- ✅ Access key generation
- ✅ Suggestion management
- ✅ BFF layer (API Routes) for security

## 🎯 Next Steps

### Deploy to Production

1. **Deploy Frontend to Vercel**:
   ```bash
   cd web
   vercel
   ```

2. **Add Environment Variables in Vercel**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your Vercel domain

3. **Update Cognito Callback URLs** with Vercel domain

### Customize

- **Change Recurrence Schedule**: Edit `infra/lib/poll-system-stack.ts` → EventBridge cron expression
- **Add More Poll Types**: Extend `CreatePollRequest` interface in `create-poll.ts`
- **Custom Styling**: Update Tailwind classes in frontend components
- **Add Analytics**: Integrate with CloudWatch Insights or external analytics

### Secure API Gateway

Currently, the API Key is a placeholder. To secure production:

1. **Generate API Key**:
   ```bash
   aws apigateway create-api-key --name "PollSystemKey" --enabled
   ```

2. **Create Usage Plan**:
   ```bash
   aws apigateway create-usage-plan \
     --name "PollSystemPlan" \
     --api-stages apiId=<API_ID>,stage=<STAGE>
   ```

3. **Associate Key with Plan**:
   ```bash
   aws apigateway create-usage-plan-key \
     --usage-plan-id <PLAN_ID> \
     --key-id <KEY_ID> \
     --key-type API_KEY
   ```

## 📚 Documentation

- **Architecture**: See `ARCHITECTURE.md`
- **API Reference**: See `API.md`
- **Deployment Guide**: See `DEPLOYMENT.md`

## 🐛 Troubleshooting

### "Unauthorized" when accessing admin
- Verify Cognito credentials are correct
- Check `.env.local` has correct `COGNITO_ISSUER`
- Ensure callback URLs are configured

### "Failed to fetch poll"
- Verify API Gateway endpoint is correct
- Check Lambda logs in CloudWatch
- Ensure DynamoDB tables exist

### "Access key has expired"
- Keys have TTL, generate new ones
- Check `ExpiryDate` in AccessKeys table

## 💡 Tips

- **Development**: Use `npm run dev` in web folder
- **Logs**: Check CloudWatch Logs for Lambda errors
- **DynamoDB**: Use AWS Console to inspect table data
- **Testing**: Use Postman/curl to test API endpoints directly

## 🤝 Contributing

This is a complete serverless poll system. Feel free to extend it with:
- Real-time results (WebSockets)
- Email notifications (SES)
- Advanced analytics (QuickSight)
- Multi-language support (i18n)

---

**Built with ❤️ using AWS, Next.js, and TypeScript**

