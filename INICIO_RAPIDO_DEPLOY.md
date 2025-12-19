# ⚡ Inicio Rápido - Deployment Gratuito

## 🎯 Stack Gratuito Recomendado

- **Backend**: [Render.com](https://render.com) - Node.js hosting gratis
- **MySQL**: [TiDB Cloud](https://tidbcloud.com) - Base de datos MySQL-compatible (completamente gratis, 5 GB)
- **Frontend Web**: [Vercel](https://vercel.com) - React hosting gratis
- **App Móvil**: Expo EAS Build - Gratis para Android

## 📋 Checklist Rápido

### 1. Base de Datos (5 min)
- [ ] Crear cuenta en [TiDB Cloud](https://tidbcloud.com) → Sign Up (puedes usar GitHub)
- [ ] Crear Cluster → Seleccionar **"Serverless"** (gratis)
- [ ] Configurar nombre y región del cluster
- [ ] Copiar credenciales de conexión desde la pestaña "Connect":
  - Host, Puerto (4000), Usuario, Contraseña, Nombre BD
- [ ] Ejecutar SQL en este orden:
  1. Primero: `backend/create_tables.sql` (crea las tablas)
  2. Segundo: `backend/seeds/categories_seed.sql` (pobla los datos)

### 2. Backend (10 min)
- [ ] Crear cuenta en [Render.com](https://render.com)
- [ ] Conectar repositorio de GitHub
- [ ] Crear Web Service con estas configuraciones:
  - Build: `cd backend && npm install`
  - Start: `cd backend && npm start`
- [ ] Configurar variables de entorno (ver abajo)
- [ ] Deploy y copiar URL del backend

### 3. Frontend (5 min)
- [ ] Crear cuenta en [Vercel](https://vercel.com)
- [ ] Conectar repositorio de GitHub
- [ ] Configurar:
  - Root Directory: `frontend`
  - Framework: Vite
- [ ] Agregar variables de entorno (ver abajo)
- [ ] Deploy y copiar URL del frontend
- [ ] Actualizar `FRONTEND_URL` en Render

### 4. App Móvil (Opcional)
- [ ] Crear `mobile/.env` con URLs de producción
- [ ] Build con: `npx eas build --platform android`

## 🔑 Variables de Entorno

### Backend (Render.com)

**Configuración para TiDB Cloud:**
```
PORT=10000
NODE_ENV=production
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_NAME=personajes
DB_USER=tu-usuario-de-tidb
DB_PASSWORD=tu-contraseña-de-tidb
DB_SSL=true
JWT_SECRET=genera-uno-seguro
FRONTEND_URL=https://tu-app.vercel.app
```

**⚠️ IMPORTANTE:**
- `DB_PORT` debe ser `4000` (NO 3306)
- `DB_SSL` debe ser `true` (OBLIGATORIO para TiDB Cloud)
- Reemplaza los valores con tus credenciales reales de TiDB Cloud
- **Nota**: También puedes usar variables `TIDB_*` (ver `backend/TIDB_CONNECTION.md`)

### Frontend (Vercel)
```
VITE_API_URL=https://personajes-backend.onrender.com/api
VITE_SOCKET_URL=https://personajes-backend.onrender.com
```

### App Móvil (mobile/.env)
```
EXPO_PUBLIC_API_URL=https://personajes-backend.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://personajes-backend.onrender.com
```

## 📚 Documentación Completa

Para una guía detallada paso a paso, lee: **[DEPLOY_GRATIS.md](./DEPLOY_GRATIS.md)**

## ✅ Verificar Configuración

Ejecuta antes de deployar:
```bash
node check-deployment.js
```

## 🆘 Problemas Comunes

**Backend se "duerme"**: Normal en plan gratis de Render. Se despierta en ~30 seg.

**CORS errors**: Verifica que `FRONTEND_URL` en Render apunta a tu URL de Vercel.

**MySQL no conecta**: 
- Verifica que `DB_SSL=true` y puerto `4000` (NO 3306)
- Verifica que las credenciales son exactamente las de TiDB Cloud
- Verifica que el cluster en TiDB Cloud esté activo

## 💡 Tips

1. **Empieza con TiDB Cloud** → Luego Render → Luego Vercel
2. **Copia las URLs** de cada servicio antes de continuar
3. **Prueba cada paso** antes de pasar al siguiente
4. **Revisa los logs** si algo falla

¡Buena suerte! 🚀
