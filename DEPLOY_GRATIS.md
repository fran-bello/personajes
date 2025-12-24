# 🚀 Guía de Deployment Gratuito - Paso a Paso

Esta guía te ayudará a deployar tu aplicación **Personajes** completamente gratis usando servicios gratuitos.

## 📋 Stack Recomendado (100% Gratis)

| Componente | Servicio | URL | Costo |
|------------|----------|-----|-------|
| **Backend** | Render.com | https://render.com | ✅ Gratis |
| **MySQL** | TiDB Cloud | https://tidbcloud.com | ✅ Gratis |
| **Frontend Web** | Vercel | https://vercel.com | ✅ Gratis |
| **App Móvil** | Expo EAS | Incluido con Expo | ✅ Gratis (Android) |

**Nota**: TiDB Cloud Serverless es completamente gratis con 5 GB por base de datos, sin límite de tiempo.

---

## 🎯 Paso 1: Preparar el Repositorio

### 1.1 Verificar que todo está en GitHub

```bash
# Asegúrate de estar en la raíz del proyecto
cd e:\laragon\www\personajes

# Verificar estado
git status

# Si hay cambios, hacer commit
git add .
git commit -m "Preparado para deployment"
git push origin main
```

### 1.2 Verificar que .env está en .gitignore

✅ Ya está configurado en `.gitignore` - los archivos `.env` no se subirán a GitHub.

---

## 🗄️ Paso 2: Configurar Base de Datos MySQL (TiDB Cloud) ⭐

TiDB Cloud Serverless es completamente gratis y compatible con MySQL. Ofrece 5 GB por base de datos sin límite de tiempo.

#### 2.1 Crear cuenta en TiDB Cloud

1. Ve a [tidbcloud.com](https://tidbcloud.com)
2. Haz clic en **"Sign Up"** o **"Get Started"** (puedes usar GitHub)
3. Verifica tu email si es necesario
4. **No requiere tarjeta de crédito** ✅

#### 2.2 Crear Cluster Serverless

1. Una vez en el dashboard, haz clic en **"Create Cluster"** o **"New Cluster"**
2. Selecciona **"Serverless"** (plan gratuito)
3. Configuración:
   - **Cluster Name**: `personajes` (o el nombre que prefieras)
   - **Region**: Elige la más cercana a ti (ej: `us-west-2`, `us-east-1`, etc.)
   - **Project**: Puedes crear uno nuevo o usar el default
4. Haz clic en **"Create"** o **"Create Cluster"**
5. Espera a que se cree el cluster (1-2 minutos)

#### 2.3 Obtener Credenciales de Conexión

1. Una vez creado el cluster, haz clic en él para abrirlo
2. Ve a la pestaña **"Connect"** o busca el botón **"Connect"**
3. Selecciona **"Node.js"** como lenguaje de conexión
4. Copia las credenciales que te muestra (las necesitarás para Render):
   - `DB_HOST`: algo como `gateway01.us-west-2.prod.aws.tidbcloud.com` o similar
   - `DB_PORT`: `4000` ⚠️ **IMPORTANTE**: TiDB usa puerto 4000, NO 3306
   - `DB_USER`: tu usuario (algo como `xxxxx.root`)
   - `DB_PASSWORD`: la contraseña que te muestra (o la que configuraste)
   - `DB_NAME`: el nombre de tu cluster (ej: `personajes`)
   - **Nota**: TiDB requiere SSL, ya está configurado en el código con `DB_SSL=true`

**💡 Tip**: Guarda estas credenciales en un lugar seguro, las necesitarás para configurar Render.

#### 2.4 Ejecutar Migraciones y Seeds

**⚠️ IMPORTANTE**: Debes ejecutar los scripts en este orden:
1. **Primero**: Crear las tablas (`create_tables.sql`)
2. **Segundo**: Poblar con datos (`categories_seed.sql`)

Tienes dos opciones para ejecutar los scripts SQL:

**Opción A: Usando el SQL Editor de TiDB Cloud (Recomendado)**

1. En el dashboard de TiDB Cloud, haz clic en tu cluster
2. Ve a la pestaña **"SQL Editor"** o busca **"Chat2Query"** / **"SQL Editor"**
3. **Paso 1 - Crear tablas:**
   - Abre el archivo `backend/create_tables.sql` en tu proyecto
   - Copia y pega **TODO** el contenido en el SQL Editor
   - Haz clic en **"Run"** o **"Execute"**
   - Verifica que se crearon las 4 tablas: `users`, `categories`, `characters`, `games`
4. **Paso 2 - Poblar categorías y personajes:**
   - Abre el archivo `backend/seeds/categories_seed.sql`
   - Copia y pega **TODO** el contenido en el SQL Editor
   - Haz clic en **"Run"** o **"Execute"**
   - Esto insertará todas las categorías y personajes predefinidos

**Opción B: Usando un Cliente MySQL**

1. Descarga un cliente MySQL como [MySQL Workbench](https://www.mysql.com/products/workbench/) o [DBeaver](https://dbeaver.io/)
2. Conéctate usando las credenciales de TiDB:
   - Host: `gateway01.us-west-2.prod.aws.tidbcloud.com` (tu host)
   - Port: `4000` ⚠️ **No uses 3306**
   - Username: tu usuario
   - Password: tu contraseña
   - Database: nombre de tu cluster
   - SSL: Habilitado
3. **Paso 1**: Ejecuta `backend/create_tables.sql` completo
4. **Paso 2**: Ejecuta `backend/seeds/categories_seed.sql` completo

**💡 Tip**: Si tienes problemas conectando con un cliente, verifica que estés usando el puerto 4000 y que SSL esté habilitado.

**📝 Nota**: El archivo `categories_seed.sql` solo contiene INSERTs, NO crea las tablas. Por eso debes ejecutar primero `create_tables.sql`.

1. Ve a [northflank.com](https://northflank.com)
2. Crea cuenta gratuita
3. Crea un servicio MySQL
4. Obtén las credenciales de conexión

---

## ⚙️ Paso 3: Deployar Backend en Render.com

### 3.1 Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Conecta tu cuenta de GitHub
4. Autoriza el acceso a tu repositorio

### 3.2 Crear Web Service (Backend)

1. En el dashboard, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub:
   - Selecciona el repositorio `personajes`
   - Haz clic en **"Connect"**
3. Configuración del servicio:
   - **Name**: `personajes-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon` (o la más cercana)
   - **Branch**: `main`
   - **Root Directory**: (dejar vacío)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: `Free`

4. Haz clic en **"Advanced"** y configura las **Environment Variables**:

```
PORT=10000
NODE_ENV=production
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_NAME=personajes
DB_USER=tu-usuario-de-tidb
DB_PASSWORD=tu-contraseña-de-tidb
DB_SSL=true
JWT_SECRET=genera-uno-seguro-aqui
FRONTEND_URL=https://tu-app.vercel.app
```

**⚠️ IMPORTANTE para TiDB Cloud:**
- `DB_PORT` debe ser `4000` (NO 3306)
- `DB_SSL` debe ser `true` (OBLIGATORIO para TiDB Cloud Starter/Essential)
- Reemplaza `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con tus credenciales reales de TiDB Cloud
- **Nota**: También puedes usar variables `TIDB_*` según la documentación oficial (ver `backend/TIDB_CONNECTION.md`)

**🔑 Generar JWT_SECRET seguro:**
```bash
# En Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# O usa un generador online: https://generate-secret.vercel.app/32
```

**⚠️ Nota**: `FRONTEND_URL` lo actualizarás después de deployar el frontend.

5. Haz clic en **"Create Web Service"**

### 3.3 Esperar el Deploy

- Render comenzará a construir y deployar tu backend
- Esto puede tomar 5-10 minutos la primera vez
- Verás los logs en tiempo real
- Al finalizar, obtendrás una URL: `https://personajes-backend.onrender.com`

### 3.4 Verificar que funciona

1. Abre la URL del backend en el navegador
2. Deberías ver un error 404 (normal, no hay ruta raíz)
3. Prueba: `https://personajes-backend.onrender.com/api/categories`
4. Deberías ver un JSON (vacío o con datos si ejecutaste el seed)

**🐌 Nota**: El plan gratuito de Render "duerme" después de 15 min de inactividad. Se despierta en ~30 seg cuando alguien lo usa.

---

## 🌐 Paso 4: Deployar Frontend en Vercel

### 4.1 Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Conecta tu cuenta de GitHub
4. Autoriza el acceso a tu repositorio

### 4.2 Crear Proyecto

1. En el dashboard, haz clic en **"Add New..."** → **"Project"**
2. Importa tu repositorio:
   - Selecciona el repositorio `personajes`
   - Haz clic en **"Import"**
3. Configuración del proyecto:
   - **Framework Preset**: `Vite` (se detecta automáticamente)
   - **Root Directory**: `frontend` ⚠️ **IMPORTANTE**: Cambia esto a `frontend`
   - **Build Command**: `npm run build` (ya está configurado)
   - **Output Directory**: `dist` (ya está configurado)
   - **Install Command**: `npm install` (ya está configurado)

4. Haz clic en **"Environment Variables"** y agrega:

```
VITE_API_URL=https://personajes-backend.onrender.com/api
VITE_SOCKET_URL=https://personajes-backend.onrender.com
```

**⚠️ Reemplaza** `personajes-backend.onrender.com` con la URL real de tu backend de Render.

5. Haz clic en **"Deploy"**

### 4.3 Esperar el Deploy

- Vercel construirá y deployará tu frontend
- Esto toma 2-5 minutos
- Al finalizar, obtendrás una URL: `https://personajes-frontend.vercel.app`

### 4.4 Actualizar Backend con URL del Frontend

1. Ve a Render.com → Tu servicio `personajes-backend`
2. Ve a **"Environment"**
3. Actualiza la variable `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://personajes-frontend.vercel.app
   ```
4. Haz clic en **"Save Changes"**
5. Render reiniciará automáticamente el servicio

---

## 📱 Paso 5: Configurar App Móvil (Expo)

### 5.1 Actualizar URL del Backend en la App

La app móvil necesita saber dónde está el backend en producción.

**Opción A: Usar Variables de Entorno de Expo (Recomendado)**

1. Crea el archivo `mobile/.env`:

```bash
cd mobile
```

Crea un archivo `.env` con:

```
EXPO_PUBLIC_API_URL=https://personajes-backend.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://personajes-backend.onrender.com
```

2. Instala `expo-constants` si no está (ya está en package.json)

3. Actualiza `mobile/src/services/api.ts` (si existe) o crea el servicio:

```typescript
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl 
  || process.env.EXPO_PUBLIC_API_URL 
  || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Opción B: Hardcodear (Temporal)**

Si prefieres algo más simple, busca en los archivos de la app móvil donde se hace `fetch` o `axios` y reemplaza `localhost:3001` con tu URL de Render.

### 5.2 Build de la App Móvil

**Para Android (Gratis):**

```bash
cd mobile
npm install
npx eas build --platform android --profile production
```

Esto generará un archivo `.apk` que puedes instalar en Android.

**Para iOS (Requiere cuenta de desarrollador - $99/año):**

```bash
npx eas build --platform ios --profile production
```

---

## ✅ Paso 6: Verificar que Todo Funciona

### Checklist de Verificación:

- [ ] **Backend**: `https://personajes-backend.onrender.com/api/categories` responde
- [ ] **Frontend**: `https://personajes-frontend.vercel.app` se abre correctamente
- [ ] **Registro/Login**: Funciona desde el frontend
- [ ] **Crear Partida**: Funciona desde el frontend
- [ ] **WebSockets**: Las actualizaciones en tiempo real funcionan
- [ ] **App Móvil**: Se conecta al backend correcto

### Probar Endpoints del Backend:

```bash
# Categorías (debe devolver JSON)
curl https://personajes-backend.onrender.com/api/categories

# Health check (si lo implementas)
curl https://personajes-backend.onrender.com/api/health
```

---

## 🔧 Configuración Adicional

### Mantener Backend Despierto (Opcional)

El plan gratuito de Render se "duerme" después de 15 min. Para mantenerlo activo:

1. Usa [UptimeRobot](https://uptimerobot.com) (gratis)
2. Crea un monitor que haga ping cada 5 minutos a tu backend
3. Esto evitará que se duerma

### CORS

Si tienes problemas de CORS, verifica:

1. `FRONTEND_URL` en Render apunta a la URL correcta de Vercel
2. El código en `backend/server.js` tiene `cors()` configurado correctamente

### WebSockets

Render soporta WebSockets, pero si tienes problemas:

1. Verifica que `VITE_SOCKET_URL` en Vercel apunta al backend correcto
2. Verifica que `FRONTEND_URL` en Render incluye el protocolo `https://`

---

## 🐛 Solución de Problemas

### Backend no conecta a MySQL

**Síntomas**: Error "Error conectando a MySQL" en los logs de Render

**Solución**:
1. Verifica que las credenciales en Render son correctas (copia exacta desde TiDB Cloud)
2. **IMPORTANTE para TiDB**: Verifica que `DB_SSL=true` y que el puerto es `4000` (NO 3306)
3. Verifica que el `DB_HOST` es exactamente el que te dio TiDB Cloud (algo como `gateway01.us-west-2.prod.aws.tidbcloud.com`)
4. Verifica que el `DB_USER` incluye el formato correcto (ej: `xxxxx.root`)
5. Verifica que el `DB_NAME` es el nombre de tu cluster en TiDB
6. Revisa los logs de Render para más detalles del error
7. Si el error persiste, verifica en TiDB Cloud que el cluster esté activo y funcionando

### CORS Errors

**Síntomas**: Error en consola del navegador sobre CORS

**Solución**:
1. Verifica `FRONTEND_URL` en Render
2. Asegúrate de incluir `https://` en la URL
3. Verifica que `cors()` está en `server.js`

### WebSockets no funcionan

**Síntomas**: Las actualizaciones en tiempo real no funcionan

**Solución**:
1. Verifica `VITE_SOCKET_URL` en Vercel
2. Verifica la configuración de Socket.io en `server.js`
3. Considera usar Railway.app si Render no funciona bien con WebSockets

### Frontend muestra errores 404

**Síntomas**: Al navegar, Vercel muestra 404

**Solución**:
1. Verifica que `vercel.json` está en la carpeta `frontend/`
2. Verifica que el `rewrites` está configurado correctamente

---

## 📚 Recursos Útiles

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---

## 💰 Costos

**Total: $0/mes** ✅

- Render.com: Gratis (con límites, se "duerme" después de 15 min)
- TiDB Cloud Serverless: Completamente gratis (5 GB por base de datos, sin límite de tiempo)
- Vercel: Gratis (ilimitado para proyectos personales)
- Expo EAS: Gratis para Android

**Límites del plan gratis de TiDB Cloud:**
- 5 GB de almacenamiento por base de datos
- Hasta 5 bases de datos
- Sin límite de tiempo
- Sin tarjeta de crédito requerida

---

## 🎉 ¡Listo!

Tu aplicación está deployada y funcionando. Comparte las URLs con tus usuarios:

- **Frontend Web**: `https://personajes-frontend.vercel.app`
- **Backend API**: `https://personajes-backend.onrender.com`
- **App Móvil**: Descarga el `.apk` desde Expo

¡Disfruta tu aplicación en producción! 🚀




