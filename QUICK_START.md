# 🚀 Resumen Rápido de Despliegue

## 📦 Archivos Preparados

✅ Todos los archivos de configuración están listos:

```
editor-colaborativo/
├── backend/
│   ├── src/server.js          ✅ Servidor Socket.IO
│   ├── package.json           ✅ Scripts start/dev configurados
│   └── .env.example           ✅ Variables de entorno
├── frontend/
│   ├── src/                   ✅ Código React
│   ├── package.json           ✅ Build configurado
│   ├── vercel.json            ✅ Configuración Vercel
│   └── .env.example           ✅ Variables de entorno
├── render.yaml                ✅ Configuración Render
├── .gitignore                 ✅ Archivos ignorados
└── DEPLOYMENT.md              ✅ Guía completa
```

---

## 🎯 Pasos Siguientes (en orden)

### 1️⃣ Subir a GitHub
```bash
git add .
git commit -m "Preparar para despliegue en Vercel y Render"
git push origin main
```

### 2️⃣ Desplegar Backend en Render
1. Ir a https://dashboard.render.com/
2. New + → Web Service
3. Conectar repositorio
4. **Root Directory:** `backend`
5. **Build Command:** `pnpm install`
6. **Start Command:** `pnpm start`
7. Deploy → **Copiar la URL generada** 📋

### 3️⃣ Desplegar Frontend en Vercel
1. Ir a https://vercel.com/dashboard
2. Add New → Project
3. Importar repositorio
4. **Root Directory:** `frontend`
5. **Environment Variable:**
   - Name: `VITE_BACKEND_URL`
   - Value: `<URL de Render del paso 2>` 📋
6. Deploy

### 4️⃣ Probar
1. Abrir URL de Vercel
2. Verificar conexión (debe aparecer "Conectado" en verde)
3. Compartir enlace y probar colaboración

---

## ⚡ URLs Importantes

Después del despliegue tendrás:

- **Frontend:** `https://tu-proyecto.vercel.app`
- **Backend:** `https://editor-colaborativo-backend.onrender.com`

---

## 🔧 Variable de Entorno Crítica

**En Vercel, debes configurar:**

```
VITE_BACKEND_URL = https://tu-backend.onrender.com
```

⚠️ **Sin esta variable, el frontend no se conectará al backend**

---

## 📖 Documentación Completa

Para instrucciones detalladas, ver: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## ⏱️ Tiempo Estimado

- Backend en Render: ~5-10 minutos
- Frontend en Vercel: ~2-5 minutos
- **Total: ~15 minutos** ⚡

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Desconectado" en el frontend | Verificar `VITE_BACKEND_URL` en Vercel |
| Backend tarda en responder | Normal en plan gratuito de Render (se duerme) |
| Error de build | Verificar que `pnpm` esté seleccionado |

---

¡Éxito! 🎉
