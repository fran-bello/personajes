# ⚡ Deployment Rápido - Resumen

## 🎯 Stack Recomendado (100% Gratis)

1. **Backend**: [Render.com](https://render.com) - Node.js hosting
2. **MySQL**: [PlanetScale](https://planetscale.com) - Base de datos MySQL
3. **Frontend Web**: [Vercel](https://vercel.com) - React hosting
4. **App Móvil**: Expo EAS Build (gratis para Android)

---

## 📋 Pasos Rápidos

### 1. Backend en Render (5 min)

1. Ve a [render.com](https://render.com) → Sign up con GitHub
2. "New +" → "Web Service"
3. Conecta tu repo de GitHub
4. Configuración:
   - **Name**: `personajes-backend`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Agrega variables de entorno (ver abajo)
6. Deploy! → Obtendrás: `https://personajes-backend.onrender.com`

### 2. MySQL en PlanetScale (3 min)

1. Ve a [planetscale.com](https://planetscale.com) → Sign up
2. "Create database" → Name: `personajes`
3. Ve a "Connect" → Copia las credenciales
4. Ejecuta el seed SQL:
   - Ve a "Console" → SQL Editor
   - Pega contenido de `backend/seeds/categories_seed.sql`
   - Ejecuta

### 3. Frontend Web en Vercel (3 min) ⚠️ OPCIONAL

**Nota**: Esto es para la versión WEB del juego (carpeta `frontend/`), que se abre en navegadores.
Si solo quieres la app móvil, puedes saltar este paso.

1. Ve a [vercel.com](https://vercel.com) → Sign up con GitHub
2. "New Project" → Conecta tu repo
3. Configuración:
   - **Root Directory**: `frontend` ⚠️ Importante: apunta a la carpeta `frontend/`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Agrega variable de entorno:
   - `VITE_API_URL` = `https://tu-backend.onrender.com/api`
5. Deploy!

**Resultado**: `https://tu-app.vercel.app` (juega desde el navegador)

### 4. Actualizar App Móvil (NO va en Vercel)

**La app móvil NO se deploya en Vercel**, se build con Expo:

1. Edita `mobile/src/services/api.ts` (ya está actualizado para usar variables de entorno)

2. Crea `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com/api
```

3. Build la app:
```bash
cd mobile
npx eas build --platform android  # Para Android (gratis)
```

**Resultado**: Archivo `.apk` que instalas en Android

**Nota**: Vercel es solo para el frontend web (`frontend/`), NO para la app móvil (`mobile/`)

---

## 🔑 Variables de Entorno

### Backend (Render)

```
PORT=10000
DB_HOST=tu-host.planetscale.com
DB_PORT=3306
DB_NAME=personajes
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
JWT_SECRET=genera-uno-seguro-con-openssl-rand-base64-32
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Frontend (Vercel)

```
VITE_API_URL=https://tu-backend.onrender.com/api
VITE_SOCKET_URL=https://tu-backend.onrender.com
```

### App Móvil (Expo)

```
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com/api
```

---

## ⚠️ Notas Importantes

1. **Render se "duerme"**: El backend gratis se duerme después de 15 min. Se despierta en ~30 seg cuando alguien lo usa.

2. **WebSockets**: Render soporta WebSockets, pero si tienes problemas, considera Railway.app

3. **CORS**: Asegúrate de que `FRONTEND_URL` en el backend apunta a tu URL de Vercel.

4. **MySQL Connection**: PlanetScale usa SSL. Asegúrate de que tu código de conexión soporte SSL.

---

## 🐛 Troubleshooting

**Backend no conecta a MySQL:**
- Verifica credenciales en Render
- Verifica que PlanetScale permite conexiones externas
- Revisa logs en Render dashboard

**CORS errors:**
- Verifica `FRONTEND_URL` en backend
- Verifica que `cors()` está configurado en `server.js`

**WebSockets no funcionan:**
- Render soporta WebSockets, pero verifica la configuración
- Alternativa: Railway.app también soporta WebSockets

---

## 📚 Documentación Completa

Ver `DEPLOYMENT_GUIDE.md` para guía detallada.

---

## ✅ Checklist Final

- [ ] Backend deployado en Render
- [ ] MySQL creado en PlanetScale
- [ ] Seed SQL ejecutado
- [ ] Frontend deployado en Vercel
- [ ] Variables de entorno configuradas
- [ ] App móvil actualizada con URL de producción
- [ ] Probado registro/login
- [ ] Probado creación de partidas
- [ ] Probado WebSockets (tiempo real)

¡Listo! 🚀
