# 📱💻 Diferencia entre Frontend Web y App Móvil

Tu proyecto tiene **DOS frontends diferentes**:

---

## 1. 🌐 Frontend Web (`/frontend`) → **Vercel**

**Ubicación**: `frontend/`
**Tecnología**: React + Vite
**Para qué**: Versión web del juego que se abre en el navegador
**Deployment**: **Vercel** (o Netlify, GitHub Pages, etc.)

### Características:
- ✅ Se abre en cualquier navegador (Chrome, Firefox, Safari, etc.)
- ✅ No requiere instalación
- ✅ Funciona en PC, Mac, tablets
- ✅ Comparte código con la app móvil pero es una versión web

### Archivos principales:
```
frontend/
├── src/
│   ├── App.jsx          # Aplicación principal
│   ├── components/      # Componentes React
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── GameRoom.jsx
│   │   └── ...
│   └── context/
│       └── AuthContext.jsx
├── package.json
└── vite.config.js
```

### Deployment en Vercel:
1. Conecta tu repo de GitHub a Vercel
2. Configura:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Agrega variable: `VITE_API_URL=https://tu-backend.onrender.com/api`
4. ¡Deploy!

**Resultado**: `https://tu-app.vercel.app` (accesible desde cualquier navegador)

---

## 2. 📱 App Móvil (`/mobile`) → **NO va en Vercel**

**Ubicación**: `mobile/`
**Tecnología**: React Native + Expo
**Para qué**: Aplicación nativa para Android/iOS
**Deployment**: **Expo EAS Build** (NO Vercel)

### Características:
- ✅ App instalable en teléfonos Android/iOS
- ✅ Funciona offline (juego local)
- ✅ Mejor experiencia en móviles
- ✅ Puede publicarse en Google Play / App Store

### Archivos principales:
```
mobile/
├── app/                 # Expo Router (navegación)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/
│   │   ├── dashboard.tsx
│   │   ├── create-game.tsx
│   │   └── game/[roomCode].tsx
│   └── local-game.tsx
├── src/
│   ├── services/
│   │   └── api.ts       # Conexión al backend
│   └── components/
├── app.json
└── package.json
```

### Deployment:
```bash
cd mobile
npx eas build --platform android  # Para Android APK
```

**Resultado**: Archivo `.apk` (Android) o `.ipa` (iOS) que instalas en el teléfono

---

## 🤔 ¿Cuál usar?

### Usa Frontend Web (Vercel) si:
- ✅ Quieres que la gente juegue desde el navegador
- ✅ No quieres que instalen nada
- ✅ Quieres acceso rápido desde cualquier dispositivo
- ✅ Es más fácil de compartir (solo envías un link)

### Usa App Móvil (Expo) si:
- ✅ Quieres una app "nativa" instalable
- ✅ Quieres publicar en Google Play / App Store
- ✅ Quieres mejor rendimiento en móviles
- ✅ Quieres funcionalidades offline

---

## 💡 Recomendación

**Puedes tener AMBOS**:
1. **Frontend Web en Vercel** → Para jugar desde navegador
2. **App Móvil con Expo** → Para instalar en teléfonos

Ambos se conectan al mismo backend, así que:
- Los usuarios pueden elegir cómo jugar
- Comparten las mismas partidas online
- Misma base de datos

---

## 📋 Resumen de Deployment

| Componente | Tecnología | Dónde deployar | URL Resultado |
|------------|------------|----------------|---------------|
| **Backend** | Node.js | Render.com | `https://backend.onrender.com` |
| **MySQL** | MySQL | PlanetScale | (solo conexión) |
| **Frontend Web** | React + Vite | **Vercel** | `https://app.vercel.app` |
| **App Móvil** | React Native | Expo EAS | Archivo `.apk` |

---

## 🚀 Deployment Rápido

### Frontend Web en Vercel:
```bash
# 1. Asegúrate de que frontend/ está en GitHub
# 2. Ve a vercel.com
# 3. Conecta tu repo
# 4. Configura:
#    - Root Directory: frontend
#    - Build Command: npm run build
#    - Output Directory: dist
# 5. Agrega variable: VITE_API_URL=https://tu-backend.onrender.com/api
# 6. Deploy!
```

### App Móvil (NO en Vercel):
```bash
cd mobile
# Configura .env con EXPO_PUBLIC_API_URL
npx eas build --platform android
# Descarga el .apk y compártelo
```

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito ambos frontends?**
R: No, puedes tener solo uno. El web es más fácil de deployar, la app móvil da mejor experiencia.

**P: ¿Puedo deployar la app móvil en Vercel?**
R: No, Vercel es solo para aplicaciones web. La app móvil necesita Expo EAS Build.

**P: ¿Los usuarios pueden jugar juntos si uno usa web y otro la app?**
R: ¡Sí! Ambos se conectan al mismo backend, así que pueden jugar en la misma partida.

**P: ¿Cuál es más fácil de deployar?**
R: El frontend web en Vercel es más fácil (5 minutos). La app móvil requiere más pasos.

---

¿Tienes más dudas? Revisa `DEPLOYMENT_GUIDE.md` para más detalles.
