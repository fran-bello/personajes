# 🎭 Personajes - App Móvil

Aplicación móvil del juego Personajes (Time's Up) desarrollada con React Native y Expo.

## 🚀 Tecnologías

- **Expo SDK 54** - Framework de desarrollo
- **Expo Router** - Navegación basada en archivos
- **NativeWind** - Tailwind CSS para React Native
- **TypeScript** - Tipado estático
- **React Native Reanimated** - Animaciones fluidas
- **Socket.io** - Comunicación en tiempo real
- **Expo SecureStore** - Almacenamiento seguro de tokens
- **Axios** - Cliente HTTP

## 📱 Características

- ✅ Autenticación (login/registro)
- ✅ Gestión de personajes personalizados
- ✅ Partidas online en tiempo real
- ✅ Partidas locales (un solo dispositivo)
- ✅ 3 rondas con reglas diferentes
- ✅ Sistema de puntuación por equipos
- ✅ Animaciones fluidas
- ✅ Diseño oscuro moderno

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app en tu dispositivo móvil

### Pasos

1. **Instalar dependencias:**
```bash
cd mobile
npm install
```

2. **Configurar el backend:**
   
   Edita `src/services/api.ts` y `src/services/socket.ts` para apuntar a tu servidor:
   ```typescript
   // Cambia esta IP por la de tu computadora en la red local
   const API_URL = 'http://TU_IP_LOCAL:3001/api';
   const SOCKET_URL = 'http://TU_IP_LOCAL:3001';
   ```

   Para encontrar tu IP local:
   - **Windows:** `ipconfig` en CMD
   - **Mac/Linux:** `ifconfig` o `ip addr`

3. **Iniciar la app:**
```bash
npm start
```

4. **Escanear el código QR** con Expo Go (Android) o la cámara (iOS)

## 📂 Estructura del Proyecto

```
mobile/
├── app/                    # Pantallas (Expo Router)
│   ├── _layout.tsx        # Layout raíz
│   ├── index.tsx          # Entrada principal
│   ├── local-game.tsx     # Juego local
│   ├── (auth)/            # Rutas de autenticación
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/             # Rutas protegidas
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── characters.tsx
│       ├── create-game.tsx
│       └── game/
│           └── [roomCode].tsx
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── context/           # Contextos de React
│   │   └── AuthContext.tsx
│   ├── services/          # Servicios de API
│   │   ├── api.ts
│   │   └── socket.ts
│   └── types/             # Tipos de TypeScript
│       └── index.ts
├── assets/                # Recursos estáticos
├── global.css            # Estilos globales (Tailwind)
├── tailwind.config.js    # Configuración de Tailwind
├── app.json              # Configuración de Expo
└── package.json
```

## 🎮 Uso

### Partida Online

1. **Crear cuenta** o iniciar sesión
2. **Crear partida** - Configura jugadores, personajes y tiempo
3. **Compartir código** con tus amigos
4. **Jugar** - El anfitrión inicia cuando todos estén listos

### Partida Local

1. Ir a "Juego Local" (no requiere cuenta)
2. Configurar número de jugadores y reglas
3. Cada jugador ingresa su nombre y personajes
4. Pasar el dispositivo por turnos

## 🔧 Scripts

```bash
# Iniciar servidor de desarrollo
npm start

# Iniciar en Android
npm run android

# Iniciar en iOS (solo Mac)
npm run ios

# Iniciar en web
npm run web
```

## 🌐 Conexión con Backend

La app necesita conectarse al backend de Node.js. Asegúrate de que:

1. El backend esté corriendo (`cd backend && npm run dev`)
2. Tu dispositivo móvil esté en la **misma red WiFi** que tu computadora
3. Las URLs en `api.ts` y `socket.ts` apunten a tu IP local

## 📝 Notas

- La app usa **Expo Go** para desarrollo rápido
- Para producción, necesitarás hacer un build con EAS Build
- Los tokens se almacenan de forma segura con SecureStore
- Las animaciones usan React Native Reanimated para rendimiento nativo

## 🐛 Solución de Problemas

### "Network Error" o no conecta al backend
- Verifica que el backend esté corriendo
- Confirma que estás en la misma red WiFi
- Asegúrate de usar tu IP local, no `localhost`

### La app no carga estilos
- Ejecuta `npx expo start -c` para limpiar caché
- Verifica que `global.css` esté importado en `_layout.tsx`

### Error de TypeScript
- Ejecuta `npm install` de nuevo
- Verifica que `tsconfig.json` esté configurado correctamente

## 📄 Licencia

MIT

