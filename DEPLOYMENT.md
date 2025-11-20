# 🚀 Guía de Despliegue - Editor Colaborativo

Esta guía te ayudará a desplegar el **frontend en Vercel** y el **backend en Render**.

---

## 📋 Prerequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Render](https://render.com)
- Repositorio en GitHub con tu código

---

## 🔧 Paso 1: Preparar el Repositorio

### 1.1 Verificar que tienes los archivos necesarios

✅ **Backend:**
- `backend/package.json` con scripts `start` y `dev`
- `backend/src/server.js`
- `render.yaml` en la raíz del proyecto

✅ **Frontend:**
- `frontend/package.json` con script `build`
- `frontend/vercel.json`
- `frontend/.env.example`

### 1.2 Subir cambios a GitHub

```bash
# En la raíz del proyecto
git add .
git commit -m "Preparar proyecto para despliegue"
git push origin main
```

---

## 🌐 Paso 2: Desplegar Backend en Render

### 2.1 Crear nuevo Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `programacion-compartida`

### 2.2 Configurar el servicio

**Configuración básica:**
- **Name:** `editor-colaborativo-backend` (o el nombre que prefieras)
- **Region:** Oregon (US West)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** Node
- **Build Command:** `pnpm install`
- **Start Command:** `pnpm start`

**Plan:**
- Selecciona **Free** (gratis)

### 2.3 Variables de entorno (opcional)

En la sección **Environment Variables**, puedes agregar:
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render lo asigna automáticamente)

### 2.4 Desplegar

1. Click en **"Create Web Service"**
2. Espera a que termine el despliegue (5-10 minutos)
3. **¡IMPORTANTE!** Copia la URL que te da Render, será algo como:
   ```
   https://editor-colaborativo-backend.onrender.com
   ```

---

## ⚡ Paso 3: Desplegar Frontend en Vercel

### 3.1 Importar proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Importa tu repositorio de GitHub `programacion-compartida`

### 3.2 Configurar el proyecto

**Configuración básica:**
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `pnpm run build` (detectado automáticamente)
- **Output Directory:** `dist` (detectado automáticamente)
- **Install Command:** `pnpm install`

### 3.3 Variables de entorno

En la sección **Environment Variables**, agrega:

| Name | Value |
|------|-------|
| `VITE_BACKEND_URL` | `https://editor-colaborativo-backend.onrender.com` |

⚠️ **IMPORTANTE:** Reemplaza la URL con la que copiaste de Render en el Paso 2.4

### 3.4 Desplegar

1. Click en **"Deploy"**
2. Espera a que termine el despliegue (2-5 minutos)
3. Vercel te dará una URL como:
   ```
   https://tu-proyecto.vercel.app
   ```

---

## 🎉 Paso 4: Verificar el Despliegue

### 4.1 Probar el frontend

1. Abre la URL de Vercel en tu navegador
2. Deberías ver la pantalla de inicio del editor
3. Ingresa tu nombre y únete a la sesión

### 4.2 Verificar la conexión

- El indicador de conexión debe mostrar **"Conectado"** en verde
- Deberías poder crear archivos y editar código
- Comparte el enlace con otra persona para probar la colaboración en tiempo real

### 4.3 Solución de problemas

**Si aparece "Desconectado":**

1. Verifica que la variable `VITE_BACKEND_URL` en Vercel tenga la URL correcta de Render
2. Asegúrate de que el backend en Render esté corriendo (estado "Active")
3. Revisa los logs en Render Dashboard para ver errores

**Para ver logs del backend:**
- Ve a Render Dashboard → Tu servicio → Pestaña "Logs"

**Para ver logs del frontend:**
- Abre las DevTools del navegador (F12) → Consola

---

## 🔄 Paso 5: Actualizaciones Futuras

### Para actualizar el código:

```bash
# Hacer cambios en tu código
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

**Vercel** y **Render** detectarán automáticamente los cambios y redesplegarán tu aplicación.

---

## 📝 Notas Importantes

### Limitaciones del Plan Gratuito de Render:

- ⏰ El servicio se "duerme" después de 15 minutos de inactividad
- 🐌 La primera conexión después de dormir puede tardar 30-60 segundos
- 💾 750 horas de uso gratuito al mes

### Alternativas si Render es muy lento:

1. **Railway.app** - Similar a Render, más rápido
2. **Fly.io** - Buena opción gratuita
3. **Heroku** - Ya no tiene plan gratuito, pero es muy confiable

---

## 🛠️ Comandos Útiles

### Desarrollo local:

```bash
# Backend
cd backend
pnpm install
pnpm dev

# Frontend (en otra terminal)
cd frontend
pnpm install
pnpm dev
```

### Verificar que el build funciona:

```bash
# Frontend
cd frontend
pnpm build
pnpm preview
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Render y Vercel
2. Verifica que las URLs estén correctas
3. Asegúrate de que el repositorio esté actualizado
4. Revisa la consola del navegador para errores de JavaScript

---

## ✅ Checklist Final

- [ ] Backend desplegado en Render y funcionando
- [ ] Frontend desplegado en Vercel
- [ ] Variable `VITE_BACKEND_URL` configurada en Vercel
- [ ] Conexión exitosa entre frontend y backend
- [ ] Prueba de edición colaborativa funcionando
- [ ] Enlace compartido funciona correctamente

---

¡Listo! 🎊 Tu editor colaborativo ya está en producción.
