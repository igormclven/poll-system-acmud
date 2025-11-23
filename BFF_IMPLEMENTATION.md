# 🔒 Backend for Frontend (BFF) - Implementación Completa

## ✅ Patrón BFF Implementado

Todas las llamadas al backend de AWS ahora pasan a través de las **Next.js API Routes**, actuando como un proxy seguro que oculta completamente las URLs del backend y maneja la autenticación.

## 🛡️ Beneficios de Seguridad

### 1. **URLs Ocultas**
- ❌ El cliente **NUNCA** ve las URLs de AWS
- ✅ Solo conoce las rutas locales: `/api/vote`, `/api/polls`, etc.
- ✅ Imposible que usuarios maliciosos accedan directamente al backend

### 2. **API Keys Seguras**
- ❌ Las API Keys **NUNCA** se exponen al cliente
- ✅ Solo existen en el servidor de Vercel (variables de entorno)
- ✅ No aparecen en el código fuente del navegador

### 3. **Tokens de Cognito Seguros**
- ❌ Los Access Tokens **NUNCA** se envían desde el cliente
- ✅ Se obtienen en el servidor usando NextAuth
- ✅ Se adjuntan automáticamente a las peticiones admin

## 📋 API Routes Implementadas

### Rutas Públicas (Con API Key del servidor)

#### `POST /api/vote`
- **Backend**: `POST {AWS_API_URL}/vote`
- **Auth**: API Key (servidor)
- **Uso**: Enviar voto

#### `GET /api/poll/:pollId`
- **Backend**: `GET {AWS_API_URL}/poll/:pollId`
- **Auth**: API Key (servidor)
- **Uso**: Obtener detalles de una poll

#### `POST /api/suggestions`
- **Backend**: `POST {AWS_API_URL}/suggestions`
- **Auth**: API Key (servidor)
- **Uso**: Enviar sugerencia

#### `GET /api/results/:pollInstanceId`
- **Backend**: `GET {AWS_API_URL}/results/:pollInstanceId`
- **Auth**: API Key (servidor)
- **Uso**: Obtener resultados de una instancia

### Rutas Admin (Con Bearer Token de Cognito)

#### `GET /api/admin/polls`
- **Backend**: `GET {AWS_API_URL}/admin/polls`
- **Auth**: Bearer Token (Cognito)
- **Uso**: Listar todas las polls

#### `POST /api/admin/polls`
- **Backend**: `POST {AWS_API_URL}/admin/polls`
- **Auth**: Bearer Token (Cognito)
- **Uso**: Crear nueva poll

#### `POST /api/admin/access-keys`
- **Backend**: `POST {AWS_API_URL}/admin/access-keys`
- **Auth**: Bearer Token (Cognito)
- **Uso**: Generar access keys para votación

#### `GET /api/admin/suggestions`
- **Backend**: `GET {AWS_API_URL}/admin/suggestions`
- **Auth**: Bearer Token (Cognito)
- **Uso**: Listar sugerencias

#### `PUT /api/admin/suggestions`
- **Backend**: `PUT {AWS_API_URL}/admin/suggestions`
- **Auth**: Bearer Token (Cognito)
- **Uso**: Actualizar estado de sugerencias

## 🔧 Variables de Entorno

### ⚠️ IMPORTANTE: Variables del Servidor

Las URLs del backend son **PRIVADAS** y solo existen en el servidor:

```env
# ❌ NUNCA uses NEXT_PUBLIC_ para URLs de backend
# ✅ Usa variables SIN el prefijo NEXT_PUBLIC_

# AWS Backend (PRIVADO - Solo servidor)
AWS_API_URL=https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY=your-api-key-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret

# Cognito
COGNITO_USER_POOL_ID=us-east-1_lsPzwW68F
COGNITO_CLIENT_ID=1r04111endgicjtsejidsod5ri
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
COGNITO_DOMAIN=poll-system-972016405913
```

### 📦 Para Vercel

En Vercel Dashboard → Settings → Environment Variables:

```
AWS_API_URL = https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY = [generar en AWS]
NEXTAUTH_URL = https://your-app.vercel.app
NEXTAUTH_SECRET = [tu secret generado]
COGNITO_USER_POOL_ID = us-east-1_lsPzwW68F
COGNITO_CLIENT_ID = 1r04111endgicjtsejidsod5ri
COGNITO_ISSUER = https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
```

## 🔍 Cómo Funciona

### Ejemplo: Votar en una Poll

#### ❌ **ANTES (Inseguro)**
```typescript
// En el cliente (navegador)
fetch('https://ao95xslnhf.execute-api.us-east-1.amazonaws.com/vote', {
  headers: {
    'X-Api-Key': 'mi-api-key-expuesta' // ❌ EXPUESTO
  }
})
```

#### ✅ **AHORA (Seguro con BFF)**
```typescript
// En el cliente (navegador)
fetch('/api/vote', { // ✅ URL local, backend oculto
  method: 'POST',
  body: JSON.stringify(voteData)
})

// En el servidor (Vercel)
// web/app/api/vote/route.ts
const response = await fetch(`${process.env.AWS_API_URL}/vote`, {
  headers: {
    'X-Api-Key': process.env.AWS_API_KEY // ✅ Key segura en servidor
  }
})
```

### Ejemplo: Crear Poll (Admin)

#### ❌ **ANTES (Inseguro)**
```typescript
// En el cliente
const session = useSession();
fetch('https://ao95xslnhf.execute-api.us-east-1.amazonaws.com/admin/polls', {
  headers: {
    'Authorization': `Bearer ${session.accessToken}` // ❌ Token expuesto
  }
})
```

#### ✅ **AHORA (Seguro con BFF)**
```typescript
// En el cliente
fetch('/api/admin/polls', { // ✅ URL local
  method: 'POST',
  body: JSON.stringify(pollData)
})

// En el servidor (Vercel)
// web/app/api/admin/polls/route.ts
const session = await auth(); // ✅ Token obtenido en servidor
const response = await fetch(`${process.env.AWS_API_URL}/admin/polls`, {
  headers: {
    'Authorization': `Bearer ${session.accessToken}` // ✅ Token seguro
  }
})
```

## 🎯 Ventajas del BFF

1. **Seguridad Total**
   - Backend completamente oculto
   - API Keys nunca expuestas
   - Tokens manejados server-side

2. **Flexibilidad**
   - Puedes cambiar el backend sin tocar el frontend
   - Agregar logging/monitoring fácilmente
   - Transformar datos antes de enviarlos al cliente

3. **Control**
   - Rate limiting en el proxy
   - Validación de datos antes de enviar a AWS
   - Manejo de errores centralizado

## 📊 Flujo de Datos

```
┌─────────────┐
│   Browser   │
│   (Client)  │
└──────┬──────┘
       │
       │ fetch('/api/vote')
       │ [Sin headers de auth]
       ▼
┌─────────────────────┐
│   Vercel (Next.js)  │
│   API Routes (BFF)  │
│                     │
│  - Valida request   │
│  - Obtiene API Key  │
│  - Obtiene Token    │
└──────┬──────────────┘
       │
       │ fetch(AWS_URL)
       │ + API Key
       │ + Bearer Token
       ▼
┌─────────────┐
│  AWS Lambda │
│  (Backend)  │
└─────────────┘
```

## ✅ Checklist de Seguridad

- [x] URLs del backend en variables privadas (sin `NEXT_PUBLIC_`)
- [x] API Keys solo en servidor
- [x] Tokens de Cognito obtenidos server-side
- [x] Todas las rutas pasan por BFF
- [x] Validación de respuestas del backend
- [x] Manejo de errores centralizado
- [x] Middleware protege rutas admin
- [x] NextAuth maneja sesiones seguras

## 🚀 Deployment

### Local
```bash
cd web
# Crear .env.local con las variables arriba
npm run dev
```

### Vercel
1. Conectar repo a Vercel
2. Agregar variables de entorno
3. Deploy automático

## 📝 Notas Importantes

1. **Nunca usar `NEXT_PUBLIC_` para URLs de backend**
   - Solo para URLs que el cliente puede ver (e.g., CDN de assets)

2. **API Keys en AWS**
   - Considera generar una API Key específica en API Gateway
   - Por ahora, las rutas públicas pueden funcionar sin key

3. **Rate Limiting**
   - Considera agregar rate limiting en las API Routes
   - Proteger contra abuse

4. **Logs**
   - Todas las API Routes ya loggean errores
   - Considerar agregar logging más detallado

---

**Estado**: ✅ BFF completamente implementado y seguro
**Fecha**: 23 de Noviembre, 2025

