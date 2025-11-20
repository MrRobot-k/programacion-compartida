# ✅ Checklist de Despliegue

Marca cada paso a medida que lo completes:

## 📋 Preparación

- [ ] Revisar que todos los archivos estén listos
- [ ] Tener cuenta en Vercel (https://vercel.com)
- [ ] Tener cuenta en Render (https://render.com)
- [ ] Tener repositorio en GitHub conectado

---

## 🔄 Git y GitHub

- [ ] Ejecutar: `git add .`
- [ ] Ejecutar: `git commit -m "Preparar para despliegue"`
- [ ] Ejecutar: `git push origin main`
- [ ] Verificar que los cambios estén en GitHub

---

## 🖥️ Backend en Render

- [ ] Ir a https://dashboard.render.com/
- [ ] Click en "New +" → "Web Service"
- [ ] Conectar repositorio de GitHub
- [ ] Seleccionar repositorio `programacion-compartida`
- [ ] Configurar:
  - [ ] Name: `editor-colaborativo-backend`
  - [ ] Region: Oregon (US West)
  - [ ] Branch: `main`
  - [ ] Root Directory: `backend`
  - [ ] Runtime: Node
  - [ ] Build Command: `pnpm install`
  - [ ] Start Command: `pnpm start`
  - [ ] Plan: Free
- [ ] Click en "Create Web Service"
- [ ] Esperar a que termine el despliegue (5-10 min)
- [ ] **COPIAR LA URL:** `https://______________.onrender.com`

---

## ⚡ Frontend en Vercel

- [ ] Ir a https://vercel.com/dashboard
- [ ] Click en "Add New..." → "Project"
- [ ] Importar repositorio `programacion-compartida`
- [ ] Configurar:
  - [ ] Framework Preset: Vite
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `pnpm run build`
  - [ ] Output Directory: `dist`
  - [ ] Install Command: `pnpm install`
- [ ] **IMPORTANTE:** Agregar variable de entorno:
  - [ ] Name: `VITE_BACKEND_URL`
  - [ ] Value: `<URL de Render copiada arriba>`
- [ ] Click en "Deploy"
- [ ] Esperar a que termine (2-5 min)
- [ ] **COPIAR LA URL:** `https://______________.vercel.app`

---

## 🧪 Pruebas

- [ ] Abrir URL de Vercel en el navegador
- [ ] Ingresar nombre y unirse a sesión
- [ ] Verificar que aparezca "Conectado" en verde
- [ ] Crear un nuevo archivo
- [ ] Escribir código y verificar que se guarda
- [ ] Copiar enlace de sesión
- [ ] Abrir en otra pestaña/navegador (modo incógnito)
- [ ] Verificar que ambas ventanas se sincronicen
- [ ] Probar edición simultánea

---

## 🎉 Finalización

- [ ] Guardar URLs en un lugar seguro:
  - Frontend: `_______________________`
  - Backend: `_______________________`
- [ ] Compartir enlace con amigos/compañeros
- [ ] Celebrar 🎊

---

## 🔧 Si algo falla

### Frontend muestra "Desconectado":
1. [ ] Verificar variable `VITE_BACKEND_URL` en Vercel
2. [ ] Verificar que backend esté "Active" en Render
3. [ ] Revisar logs en Render Dashboard
4. [ ] Abrir consola del navegador (F12) y buscar errores

### Backend no inicia:
1. [ ] Revisar logs en Render Dashboard
2. [ ] Verificar que `package.json` tenga script `start`
3. [ ] Verificar que Root Directory sea `backend`

### Build falla:
1. [ ] Verificar que se use `pnpm` como package manager
2. [ ] Revisar logs de build en Vercel/Render
3. [ ] Verificar que todas las dependencias estén en `package.json`

---

## 📞 Recursos

- [Documentación completa](./DEPLOYMENT.md)
- [Guía rápida](./QUICK_START.md)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)

---

**Tiempo estimado total:** 15-20 minutos ⏱️

¡Buena suerte! 🚀
