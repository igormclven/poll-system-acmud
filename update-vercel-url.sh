#!/bin/bash

# Script para actualizar Cognito con la URL de Vercel
# Uso: ./update-vercel-url.sh https://tu-app.vercel.app

set -e

VERCEL_URL=$1

if [ -z "$VERCEL_URL" ]; then
  echo "❌ Error: Debes proporcionar la URL de Vercel"
  echo "Uso: ./update-vercel-url.sh https://tu-app.vercel.app"
  exit 1
fi

echo "🔧 Actualizando infra/lib/poll-system-stack.ts con URL: $VERCEL_URL"

# Actualizar el archivo CDK
sed -i.bak "s|https://your-vercel-app.vercel.app|$VERCEL_URL|g" infra/lib/poll-system-stack.ts

echo "✅ Archivo actualizado"
echo ""
echo "📋 Próximos pasos:"
echo "1. Revisa los cambios en infra/lib/poll-system-stack.ts"
echo "2. Despliega el backend:"
echo "   cd infra && npm run cdk:deploy"
echo "3. Configura las variables de entorno en Vercel Dashboard"
echo "4. Verifica que el login funcione en $VERCEL_URL/auth/signin"

