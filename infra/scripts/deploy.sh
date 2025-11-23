#!/bin/bash

# Poll System - Deployment Script
# Deploys infrastructure to AWS using agentcore-ws2 profile

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Poll System Deployment Script${NC}"
echo ""

# CRITICAL: Verify AWS profile
export AWS_PROFILE=agentcore-ws2
AWS_REGION=us-east-1

echo -e "${YELLOW}⚠️  Verificando perfil de AWS...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --profile agentcore-ws2 --query Account --output text 2>/dev/null || echo "")

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: No se puede acceder al perfil 'agentcore-ws2'${NC}"
    echo "Configura el perfil usando: aws configure --profile agentcore-ws2"
    exit 1
fi

if [ "$ACCOUNT_ID" != "972016405913" ]; then
    echo -e "${RED}❌ ERROR CRÍTICO: Perfil incorrecto!${NC}"
    echo -e "${RED}Cuenta actual: $ACCOUNT_ID${NC}"
    echo -e "${RED}Cuenta esperada: 972016405913 (agentcore-ws2)${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  ADVERTENCIA: El perfil default está en PRODUCCIÓN (Europa)${NC}"
    echo -e "${YELLOW}Este proyecto DEBE usar el perfil 'agentcore-ws2' (Pruebas, USA)${NC}"
    exit 1
fi

CURRENT_REGION=$(aws configure get region --profile agentcore-ws2 || echo "")
if [ "$CURRENT_REGION" != "us-east-1" ]; then
    echo -e "${YELLOW}⚠️  Región actual: $CURRENT_REGION, configurando us-east-1...${NC}"
    AWS_REGION=us-east-1
fi

echo -e "${GREEN}✅ Perfil verificado:${NC}"
echo "   - Cuenta: $ACCOUNT_ID (agentcore-ws2)"
echo "   - Región: $AWS_REGION"
echo ""

# Build Lambda functions
echo -e "${YELLOW}🔨 Building Lambda functions...${NC}"
cd "$(dirname "$0")/.."
./build-lambdas.sh
echo ""

# Check if CDK is bootstrapped
echo -e "${YELLOW}🔍 Verificando CDK bootstrap...${NC}"
if ! aws cloudformation describe-stacks \
    --stack-name CDKToolkit \
    --profile agentcore-ws2 \
    --region us-east-1 \
    &>/dev/null; then
    echo -e "${YELLOW}⚠️  CDK no está bootstrapped en esta cuenta/región${NC}"
    echo -e "${YELLOW}Ejecutando bootstrap...${NC}"
    npx cdk bootstrap aws://972016405913/us-east-1 --profile agentcore-ws2
    echo -e "${GREEN}✅ Bootstrap completado${NC}"
else
    echo -e "${GREEN}✅ CDK ya está bootstrapped${NC}"
fi
echo ""

# Deploy
echo -e "${YELLOW}🚀 Desplegando stack a AWS...${NC}"
npx cdk deploy \
    --profile agentcore-ws2 \
    --region us-east-1 \
    --require-approval never

echo ""
echo -e "${GREEN}🎉 Deployment completado exitosamente!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "1. Guarda los outputs del stack (UserPoolId, ClientId, ApiEndpoint)"
echo "2. Crea un usuario admin con:"
echo "   aws cognito-idp admin-create-user \\"
echo "     --user-pool-id <POOL_ID> \\"
echo "     --username admin@example.com \\"
echo "     --temporary-password TempPass123! \\"
echo "     --profile agentcore-ws2 --region us-east-1"
echo ""
echo "3. Configura el frontend en web/.env.local"
echo "4. Despliega a Vercel con: cd web && vercel"
