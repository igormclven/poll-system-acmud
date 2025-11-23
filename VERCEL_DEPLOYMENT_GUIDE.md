# 🚀 Guía de Deployment a Vercel

## Pasos para Desplegar

### 1. Conectar Repositorio a Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New" → "Project"
3. Conecta tu repositorio de GitHub/GitLab
4. Selecciona el proyecto "poll system"
5. **Framework Preset**: Next.js
6. **Root Directory**: `web`
7. Click "Deploy"

Vercel te asignará una URL como: `https://poll-system-xyz.vercel.app`

---

### 2. Actualizar Cognito con la URL de Vercel

**Archivo**: `infra/lib/poll-system-stack.ts`

Reemplaza las líneas 136 y 140:

```typescript
callbackUrls: [
  'http://localhost:3000/api/auth/callback/cognito',
  'https://tu-app-vercel.vercel.app/api/auth/callback/cognito', // ← Tu URL real
],
logoutUrls: [
  'http://localhost:3000',
  'https://tu-app-vercel.vercel.app', // ← Tu URL real
],
```

Luego redesplega el backend:

```bash
cd infra
npx cdk deploy --profile agentcore-ws2 --region us-east-1
```

---

### 3. Configurar Variables de Entorno en Vercel

Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

Agrega las siguientes variables (para **Production**, **Preview**, y **Development**):

#### Variables Requeridas:

```env
# NextAuth
NEXTAUTH_URL=https://tu-app-vercel.vercel.app
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32

# Cognito
COGNITO_USER_POOL_ID=us-east-1_lsPzwW68F
COGNITO_CLIENT_ID=1r04111endgicjtsejidsod5ri
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
COGNITO_DOMAIN=poll-system-972016405913

# AWS Backend (PRIVADO - Solo servidor)
AWS_API_URL=https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY=
```

**IMPORTANTE**: Para `NEXTAUTH_SECRET`, genera uno nuevo para producción:

```bash
openssl rand -base64 32
```

---

### 4. Verificar Configuración de Vercel

En Vercel Dashboard → Settings → General:

- **Node.js Version**: 20.x (o la más reciente LTS)
- **Build Command**: `npm run build` (por defecto)
- **Output Directory**: `.next` (por defecto)
- **Install Command**: `npm install` (por defecto)
- **Root Directory**: `web`

---

### 5. Configurar Dominios (Opcional)

Si tienes un dominio personalizado:

1. Vercel Dashboard → Settings → Domains
2. Agrega tu dominio (ej: `polls.tudominio.com`)
3. Configura los DNS según las instrucciones de Vercel
4. **IMPORTANTE**: Actualiza las URLs en Cognito (CDK) con tu dominio final

---

## 🔒 Seguridad - Checklist

- [x] Variables de entorno NO usan `NEXT_PUBLIC_` para URLs de backend
- [x] `AWS_API_URL` es privada (solo servidor)
- [x] `NEXTAUTH_SECRET` es único y seguro (32+ caracteres)
- [x] Cognito callbacks incluyen la URL de Vercel
- [x] BFF (Backend for Frontend) oculta todas las URLs de AWS

---

## 🧪 Testing Post-Deployment

### 1. Test de Autenticación
```
https://tu-app-vercel.vercel.app/auth/signin
```
- Deberías ver el login de Cognito
- Login con `admin@pollsystem.com`
- Redirección al admin dashboard

### 2. Test de Votación
```
https://tu-app-vercel.vercel.app/vote?pollId=xxx&key=yyy
```
- Poll debe cargar automáticamente
- Puedes votar sin problemas

### 3. Test de Admin
```
https://tu-app-vercel.vercel.app/admin
```
- Ver lista de polls
- Crear nueva poll
- Generar access keys
- Ver resultados

---

## 🐛 Troubleshooting

### Error: "NEXTAUTH_URL is not defined"
**Solución**: Verifica que `NEXTAUTH_URL` esté en Environment Variables de Vercel

### Error: "Invalid redirect_uri"
**Solución**: La URL en Cognito (CDK) no coincide con la de Vercel. Actualiza CDK y redesplega.

### Error: "API URL not configured"
**Solución**: Asegúrate de que `AWS_API_URL` esté en las variables de entorno de Vercel.

### Build falla en Vercel
**Solución**: 
1. Verifica que el Root Directory sea `web`
2. Revisa los logs de build en Vercel
3. Asegúrate de que todas las dependencias estén en `package.json`

---

## 📊 Monitoreo

Vercel proporciona:
- **Analytics**: Visitas, performance
- **Logs**: Ver logs de funciones serverless
- **Speed Insights**: Métricas de velocidad

Accede desde: Dashboard → Tu Proyecto → Analytics

---

## 🔄 CI/CD Automático

Vercel automáticamente:
- ✅ Despliega en cada `git push` a main/master
- ✅ Crea preview deployments para branches
- ✅ Corre builds y tests
- ✅ Rollback automático si falla

---

## 💰 Costo

**Vercel Hobby (Gratis)**:
- ✅ Hasta 100 GB bandwidth
- ✅ Deployments ilimitados
- ✅ HTTPS automático
- ✅ Dominios personalizados

**Suficiente para el proyecto actual**

---

## 🎯 Resumen de URLs

Después del deployment tendrás:

```
Frontend (Vercel):
https://tu-app-vercel.vercel.app

Backend (AWS):
https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
(oculto gracias al BFF)

Cognito Login:
https://poll-system-972016405913.auth.us-east-1.amazoncognito.com
```

---

## ✅ Checklist Final

Antes de considerar el deployment completo:

- [ ] Vercel deployment exitoso
- [ ] Variables de entorno configuradas
- [ ] Cognito actualizado con URL de Vercel
- [ ] Backend CDK redesplegado
- [ ] Login funciona correctamente
- [ ] Puedes crear polls
- [ ] Puedes generar access keys
- [ ] Votación funciona
- [ ] Resultados se muestran correctamente
- [ ] Gestión de instancias funciona

---

**Fecha**: $(date)
**Stack**: Next.js en Vercel + AWS Lambda + DynamoDB + Cognito

