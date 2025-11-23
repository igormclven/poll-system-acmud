# ⚠️ IMPORTANTE: Configuración AWS

Este proyecto **REQUIERE** el uso del perfil AWS `agentcore-ws2`.

**NO uses el perfil `default`** - está configurado para producción en Europa.

## Antes de Empezar

Lee el archivo completo: **`AWS_PROFILE_CONFIG.md`**

## Deployment Rápido

```bash
cd infra
npm run cdk:deploy  # Script automático que verifica el perfil
```

## Verificación Rápida

```bash
export AWS_PROFILE=agentcore-ws2
aws sts get-caller-identity
# Debe mostrar Account: 972016405913
```

---

Para más información, consulta `AWS_PROFILE_CONFIG.md` y `DEPLOYMENT.md`

