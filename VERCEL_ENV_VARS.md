# ✅ Configuración de Variables de Entorno para Vercel

## 🎯 URL de Producción: https://poll.acmud.org

## 📋 Variables de Entorno a Configurar

Ve a: **Vercel Dashboard → poll-system → Settings → Environment Variables**

Agrega las siguientes variables para **Production**, **Preview**, y **Development**:

### Variables Requeridas:

```env
# NextAuth (CRÍTICO)
NEXTAUTH_URL=https://poll.acmud.org
NEXTAUTH_SECRET=genera-uno-nuevo-con-openssl-rand-base64-32

# Cognito
COGNITO_USER_POOL_ID=us-east-1_lsPzwW68F
COGNITO_CLIENT_ID=1r04111endgicjtsejidsod5ri
COGNITO_CLIENT_SECRET=
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_lsPzwW68F
COGNITO_DOMAIN=poll-system-972016405913

# AWS Backend (PRIVADO - Solo servidor, NO usar NEXT_PUBLIC_)
AWS_API_URL=https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
AWS_API_KEY=
```

## 🔐 Generar NEXTAUTH_SECRET

En tu terminal local:

```bash
openssl rand -base64 32
```

Copia el resultado y úsalo como valor de `NEXTAUTH_SECRET`

## ✅ Estado Actual

- [x] Backend actualizado con `poll.acmud.org`
- [x] Cognito configurado con callbacks correctos
- [ ] Variables de entorno en Vercel (tú debes hacerlo)
- [ ] Redeploy en Vercel después de agregar variables

## 🧪 Testing

Después de configurar las variables y que Vercel redespliegue:

### 1. Test de Login
```
https://poll.acmud.org/auth/signin
```
- Deberías ver el botón "Sign in with Cognito"
- Click → Redirige a Cognito Hosted UI
- Login con `admin@pollsystem.com`
- Redirige de vuelta a `https://poll.acmud.org/admin`

### 2. Test de Votación
```
https://poll.acmud.org/vote?pollId=xxx&key=yyy
```
- Poll carga automáticamente
- Puedes votar sin problemas

### 3. Test de Admin
```
https://poll.acmud.org/admin
```
- Ver/crear polls
- Generar access keys
- Ver resultados
- Gestionar instancias

## ⚠️ Importante

1. **NO uses `NEXT_PUBLIC_`** para las URLs del backend
2. Las variables del backend deben ser **privadas** (sin el prefijo)
3. Después de agregar las variables, Vercel redesplegará automáticamente
4. Si algo falla, revisa los logs en: Vercel Dashboard → Deployments → [último deploy] → View Function Logs

## 🎉 URLs Finales

```
Frontend:     https://poll.acmud.org
Admin:        https://poll.acmud.org/admin
Login:        https://poll.acmud.org/auth/signin
Vote:         https://poll.acmud.org/vote

Backend API:  https://ao95xslnhf.execute-api.us-east-1.amazonaws.com
              (oculto por BFF)

Cognito UI:   https://poll-system-972016405913.auth.us-east-1.amazoncognito.com
```

---

**Última actualización**: $(date)
**Backend status**: ✅ Desplegado con callbacks actualizados
**Frontend status**: ⏳ Esperando configuración de variables de entorno

