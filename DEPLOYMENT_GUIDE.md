# 🚀 Guía de Deployment Gratuito

Esta guía te ayudará a deployar tu aplicación **Personajes** en internet usando servicios gratuitos.

## 📋 Resumen de Componentes

Tu aplicación tiene 3 componentes principales:
1. **Backend** (Node.js + Express + Socket.io)
2. **Base de Datos** (MySQL)
3. **Frontend Web** (React + Vite) - Opcional
4. **App Móvil** (Expo) - Ya tiene deployment integrado

---

## 🎯 Opción Recomendada: Stack Completo Gratuito

### **Backend + Base de Datos: Render.com** ⭐ (MÁS FÁCIL)

**Render.com** es la opción más fácil y gratuita porque:
- ✅ Hosting gratuito para Node.js
- ✅ MySQL gratuito incluido
- ✅ WebSockets soportados
- ✅ Deploy automático desde GitHub
- ✅ SSL/HTTPS incluido

**Límites del plan gratuito:**
- Backend se "duerme" después de 15 min de inactividad (se despierta en ~30 seg)
- MySQL: 90 MB de almacenamiento
- 750 horas/mes de tiempo de ejecución

#### Pasos para deployar en Render:

1. **Preparar el repositorio:**
   ```bash
   # Asegúrate de tener todo en GitHub
   git add .
   git commit -m "Preparado para deployment"
   git push origin main
   ```

2. **Crear cuenta en Render:**
   - Ve a [render.com](https://render.com)
   - Regístrate con GitHub

3. **Crear Base de Datos MySQL:**
   - En Render Dashboard → "New +" → "PostgreSQL" (o busca MySQL)
   - Si no hay MySQL, usa **PlanetScale** (gratis, ver abajo)
   - O usa **Railway.app** para MySQL (también gratis)

4. **Deployar Backend:**
   - "New +" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configuración:
     - **Name**: `personajes-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Root Directory**: (deja vacío)

5. **Variables de Entorno en Render:**
   ```
   PORT=10000
   DB_HOST=tu-host-de-mysql.render.com
   DB_PORT=3306
   DB_NAME=personajes
   DB_USER=usuario
   DB_PASSWORD=contraseña
   JWT_SECRET=tu-secreto-super-seguro
   NODE_ENV=production
   FRONTEND_URL=https://tu-frontend.vercel.app
   ```

6. **Después del deploy:**
   - Render te dará una URL: `https://personajes-backend.onrender.com`
   - Actualiza `FRONTEND_URL` con la URL de tu frontend

---

### **Base de Datos MySQL: PlanetScale** ⭐ (ALTERNATIVA RECOMENDADA)

Si Render no tiene MySQL gratuito, usa **PlanetScale**:

1. Ve a [planetscale.com](https://planetscale.com)
2. Crea cuenta gratuita
3. Crea una base de datos:
   - Name: `personajes`
   - Region: Elige la más cercana
4. Obtén las credenciales de conexión
5. Ejecuta el seed SQL:
   - Ve a la consola SQL de PlanetScale
   - Pega el contenido de `backend/seeds/categories_seed.sql`
   - Ejecuta

**PlanetScale es gratis con:**
- 5 GB de almacenamiento
- 1 billón de filas leídas/mes
- Sin límite de tiempo

---

### **Frontend Web: Vercel** ⭐ (MÁS FÁCIL)

**Vercel** es perfecto para React/Vite:

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Variables de Entorno:**
   ```
   VITE_API_URL=https://tu-backend.onrender.com
   ```

5. **Actualiza `frontend/src` para usar la variable:**
   ```javascript
   // En tu archivo de configuración API
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
   ```

**Vercel es gratis con:**
- Deploy ilimitado
- SSL automático
- CDN global
- Sin límite de ancho de banda

---

## 🔄 Alternativas Gratuitas

### **Opción 2: Railway.app** (Todo en uno)

**Railway** puede hostear backend + MySQL en un solo lugar:

1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Agrega servicio MySQL
4. Agrega servicio Node.js para el backend

**Gratis con:**
- $5 crédito/mes (suficiente para desarrollo)
- MySQL incluido
- WebSockets soportados

---

### **Opción 3: Fly.io** (Para más control)

**Fly.io** es bueno si necesitas más control:

1. Ve a [fly.io](https://fly.io)
2. Instala CLI: `npm install -g @fly/cli`
3. Login: `fly auth login`
4. Init: `fly launch` en la carpeta `backend`

**Gratis con:**
- 3 VMs compartidas
- 3 GB de almacenamiento
- MySQL puede ser externo (PlanetScale)

---

## 📱 App Móvil (Expo)

Expo ya tiene deployment integrado y es **gratis**:

### **Para desarrollo/testing:**
```bash
cd mobile
npx expo start
# Escanea el QR con Expo Go app
```

### **Para producción (APK/IPA):**
```bash
# Android APK (gratis)
npx eas build --platform android --profile production

# iOS (requiere cuenta de desarrollador de Apple - $99/año)
npx eas build --platform ios --profile production
```

### **Actualizar URL del backend en la app:**

Edita `mobile/src/services/api.ts`:
```typescript
const API_URL = __DEV__ 
  ? 'http://localhost:3001'  // Desarrollo
  : 'https://tu-backend.onrender.com';  // Producción
```

O usa variables de entorno de Expo:
```bash
# En mobile/.env
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com
```

---

## 🎯 Stack Recomendado Final

| Componente | Servicio | Costo | Dificultad |
|------------|----------|-------|------------|
| **Backend** | Render.com | Gratis | ⭐ Fácil |
| **MySQL** | PlanetScale | Gratis | ⭐ Fácil |
| **Frontend Web** | Vercel | Gratis | ⭐ Fácil |
| **App Móvil** | Expo EAS | Gratis* | ⭐⭐ Medio |

*Android es gratis, iOS requiere cuenta de desarrollador

---

## 📝 Checklist de Deployment

### Antes de deployar:

- [ ] Todo está en GitHub
- [ ] `.env` no está en el repo (está en `.gitignore`)
- [ ] `package.json` tiene script `start` en backend
- [ ] Variables de entorno documentadas

### Durante deployment:

- [ ] Backend deployado y funcionando
- [ ] Base de datos creada y conectada
- [ ] Seed SQL ejecutado (categorías)
- [ ] Variables de entorno configuradas
- [ ] Frontend apunta al backend correcto
- [ ] App móvil actualizada con URL de producción

### Después de deployment:

- [ ] Probar registro/login
- [ ] Probar creación de partidas
- [ ] Probar WebSockets (tiempo real)
- [ ] Verificar que MySQL funciona
- [ ] Probar en app móvil

---

## 🔧 Configuración Específica

### Render.com - Backend

Crea `render.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: personajes-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Vercel - Frontend

Crea `vercel.json` en la carpeta `frontend`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

---

## 🚨 Problemas Comunes

### Backend se "duerme" en Render:
- **Solución**: Usa un servicio de "ping" como [UptimeRobot](https://uptimerobot.com) (gratis) para mantenerlo activo
- O acepta el delay de ~30 seg cuando se despierta

### CORS errors:
- Verifica que `FRONTEND_URL` en backend apunta a la URL correcta de Vercel
- Asegúrate de que `cors()` está configurado correctamente

### WebSockets no funcionan:
- Render soporta WebSockets, pero verifica la configuración
- Si no funciona, considera usar **Railway** o **Fly.io**

### MySQL connection timeout:
- Verifica que el host, puerto, usuario y contraseña son correctos
- Asegúrate de que la IP de Render está permitida en PlanetScale (si aplica)

---

## 📚 Recursos Adicionales

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---

## 💡 Tips Finales

1. **Empieza con Render + PlanetScale + Vercel** - Es el stack más fácil
2. **Usa variables de entorno** - Nunca hardcodees URLs
3. **Prueba localmente primero** - Asegúrate de que todo funciona antes de deployar
4. **Monitorea los logs** - Render y Vercel tienen dashboards con logs
5. **Backup de la BD** - PlanetScale tiene backups automáticos

¡Buena suerte con tu deployment! 🚀
