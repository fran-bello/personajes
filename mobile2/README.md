# Personajes Mobile 2 (Replica)

Esta es una réplica exacta de la aplicación web front-end de Personajes, construida con **React Native** y **Expo**.

## Características recreadas

- **UI Vibrante**: Se han portado todos los colores, gradientes y sombras del tema original.
- **Componentes Custom**: Botones con estilo gaming, inputs personalizados, y tarjetas con efecto cristal.
- **Navegación**: Implementada con `expo-router` para una experiencia nativa fluida.
- **Autenticación**: Funcionalidad completa de Login y Registro con persistencia de datos via `AsyncStorage`.
- **Servicios**: Cliente API con Axios e integración con Socket.io para tiempo real.

## Estructura del proyecto

- `app/`: Rutas de la aplicación (Expo Router).
- `assets/`: Fuentes e imágenes originales del front-end.
- `src/components/`: Reutilización de los componentes visuales adaptados a móvil.
- `src/context/`: Lógica de autenticación y estado global.
- `src/services/`: Comunicación con el backend (API y Sockets).
- `src/theme/`: Definición de colores y estilos globales.

## Cómo empezar

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Configura la IP de tu servidor en `src/services/api.js` (por defecto está configurado para emulador de Android/iOS).

3. Inicia el proyecto:
   ```bash
   npx expo start
   ```

## Estado actual
Se han implementado las pantallas de:
- [x] Login
- [x] Registro
- [x] Dashboard
- [x] Crear/Unirse a Partida
- [x] Cómo Jugar
- [ ] Sala de Juego (Online)
- [ ] Juego Local

