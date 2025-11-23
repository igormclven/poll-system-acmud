#!/bin/bash

# Poll System - Destroy Script
# Removes all AWS resources using agentcore-ws2 profile

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  ADVERTENCIA: Esta operación eliminará TODOS los recursos de AWS${NC}"
echo ""

# CRITICAL: Verify AWS profile
export AWS_PROFILE=agentcore-ws2
AWS_REGION=us-east-1

echo -e "${YELLOW}Verificando perfil de AWS...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --profile agentcore-ws2 --query Account --output text 2>/dev/null || echo "")

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: No se puede acceder al perfil 'agentcore-ws2'${NC}"
    exit 1
fi

if [ "$ACCOUNT_ID" != "972016405913" ]; then
    echo -e "${RED}❌ ERROR: Perfil incorrecto! Cuenta: $ACCOUNT_ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Perfil verificado: $ACCOUNT_ID (agentcore-ws2)${NC}"
echo ""

# Confirmation
read -p "¿Estás seguro de que quieres eliminar el stack? (escribe 'yes' para confirmar): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "Operación cancelada."
    exit 0
fi

echo ""
echo -e "${YELLOW}🗑️  Eliminando stack...${NC}"

cd "$(dirname "$0")/.."
npx cdk destroy \
    --profile agentcore-ws2 \
    --region us-east-1 \
    --force

echo ""
echo -e "${GREEN}✅ Stack eliminado exitosamente${NC}"

