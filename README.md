# Serverless Poll System

Sistema de encuestas serverless en AWS con frontend en Vercel.

## Arquitectura

- **Frontend**: Next.js en Vercel con NextAuth.js
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **IaC**: AWS CDK

## Estructura del Proyecto

```
poll-system/
├── web/              # Frontend Next.js
│   ├── src/
│   │   ├── app/      # App Router
│   │   ├── components/
│   │   └── lib/      # Utilities
│   └── package.json
├── infra/            # AWS CDK
│   ├── bin/
│   ├── lib/
│   └── lambda/       # Lambda functions
└── README.md
```

## Setup

### Prerequisites

- Node.js 20+
- AWS CLI configurado con perfil **`agentcore-ws2`** (⚠️ Ver `AWS_PROFILE_CONFIG.md`)
- AWS CDK CLI instalado

**🚨 IMPORTANTE**: Este proyecto usa el perfil AWS `agentcore-ws2` (cuenta 972016405913, región us-east-1). **NO uses el perfil default**. Lee `AWS_PROFILE_CONFIG.md` para más detalles.

### Instalación

```bash
# Instalar dependencias del frontend
cd web
npm install

# Instalar dependencias de infraestructura
cd ../infra
npm install
```

## Deployment

### Backend (AWS CDK)

```bash
cd infra

# Opción 1: Script automatizado (Recomendado - verifica perfil AWS)
npm run cdk:deploy

# Opción 2: Manual
export AWS_PROFILE=agentcore-ws2
npx cdk deploy --profile agentcore-ws2 --region us-east-1
```

**Nota**: El script `npm run cdk:deploy` verifica automáticamente que estés usando el perfil correcto antes de desplegar.

### Frontend (Vercel)

```bash
cd web
vercel
```

## Features

- ✅ Votación anónima mediante UUIDs
- ✅ Encuestas recurrentes semanales
- ✅ Sistema de sugerencias
- ✅ Dashboard de administración
- ✅ Autenticación con Cognito
- ✅ Arquitectura BFF para seguridad

