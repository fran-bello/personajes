# 🎭 Personajes - Juego Online

Juego multijugador online basado en Time's Up, donde cada jugador puede agregar sus propios personajes personalizados.

**Repositorio:** [https://github.com/fran-bello/personajes.git](https://github.com/fran-bello/personajes.git)

## Características

- ✅ Sistema de autenticación (registro/login)
- ✅ Gestión personalizada de personajes por usuario
- ✅ Partidas multijugador en tiempo real
- ✅ 3 rondas con reglas diferentes:
  - **Ronda 1**: Puedes decir todas las palabras excepto las del personaje
  - **Ronda 2**: Solo puedes decir UNA palabra
  - **Ronda 3**: Solo mímica
- ✅ Temporizador configurable
- ✅ Sistema de puntuación por equipos
- ✅ Actualizaciones en tiempo real con WebSockets

## Tecnologías

### Backend
- Node.js + Express
- MySQL (Sequelize ORM)
- Socket.io (WebSockets)
- JWT (Autenticación)
- bcryptjs (Encriptación de contraseñas)

### Frontend
- React 18
- React Router
- Axios
- Socket.io-client
- Vite

## Instalación Rápida

### Opción 1: Instalación Automática (Recomendado para Windows)

1. **Instala todas las dependencias:**
   - Ejecuta `install-all.bat` (doble clic) o desde PowerShell:
   ```bash
   .\install-all.bat
   ```

2. **Configura el backend:**
   - Ve a la carpeta `backend`
   - Copia `env.example.txt` a `.env`:
   ```bash
   copy env.example.txt .env
   ```
   - Edita `.env` y ajusta los valores si es necesario

3. **Inicia los servidores:**
   
   **Opción A - Scripts separados (2 terminales):**
   - Ejecuta `start-backend.bat` en una terminal
   - Ejecuta `start-frontend.bat` en otra terminal
   
   **Opción B - Desde la raíz (requiere `concurrently`):**
   ```bash
   npm install  # Instala concurrently
   npm run dev  # Inicia ambos servidores
   ```

### Opción 2: Instalación Manual

#### Prerrequisitos
- Node.js (v16 o superior)
- MySQL (en Laragon debería estar corriendo automáticamente)
- npm

#### Backend

1. Navega a la carpeta backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. **Crea la base de datos MySQL:**
   
   **Opción A - Desde phpMyAdmin (Docker o local):**
   - Abre phpMyAdmin: `http://localhost:8080` (o tu puerto configurado)
   - Haz clic en **"Nueva"** o **"New"** en el panel izquierdo
   - Nombre: `personajes`
   - Intercalación: `utf8mb4_unicode_ci`
   - Haz clic en **"Crear"**
   
   **Opción B - Desde línea de comandos:**
   ```sql
   CREATE DATABASE personajes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   
   **Nota:** Si usas Docker, verifica la configuración de conexión en el archivo `.env` (ver `SETUP_MYSQL_DOCKER.md`)

4. Crea un archivo `.env`:
   - Copia `env.example.txt` a `.env`
   - En Windows: `copy env.example.txt .env`
   - Edita `.env` con estos valores:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=personajes
DB_USER=root
DB_PASSWORD=          # Deja vacío si no tienes contraseña, o pon tu contraseña de Docker
JWT_SECRET=tu_secreto_super_seguro_aqui
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Inicia el servidor:
```bash
npm run dev
```

El backend estará corriendo en `http://localhost:3001`

#### Frontend

1. Navega a la carpeta frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. (Opcional) Crea un archivo `.env`:
   - Copia `env.example.txt` a `.env`
   - Los valores por defecto funcionan si el backend está en `localhost:3001`

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

## Uso

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Gestionar Personajes**: Agrega tus personajes personalizados (mínimo 10)
3. **Crear Partida**: Crea una nueva partida y comparte el código con tus amigos
4. **Unirse a Partida**: Los demás jugadores pueden unirse usando el código de sala
5. **Jugar**: El anfitrión inicia la partida y ¡a jugar!

## Estructura del Proyecto

```
personajes/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Game.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── characters.js
│   │   └── games.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Characters.jsx
│   │   │   ├── CreateGame.jsx
│   │   │   └── GameRoom.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obtener usuario actual

### Personajes
- `GET /api/characters` - Obtener personajes del usuario
- `POST /api/characters` - Agregar personaje
- `DELETE /api/characters/:character` - Eliminar personaje

### Partidas
- `POST /api/games/create` - Crear partida
- `POST /api/games/join` - Unirse a partida
- `GET /api/games/:roomCode` - Obtener partida
- `POST /api/games/:roomCode/start` - Iniciar partida
- `POST /api/games/:roomCode/hit` - Marcar acierto
- `POST /api/games/:roomCode/pass` - Pasar personaje
- `POST /api/games/:roomCode/timer` - Actualizar timer

## Desarrollo

### Iniciar ambos servidores

**Desde la raíz (requiere `npm install` primero):**
```bash
npm run dev
```

**O por separado:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**O usando los scripts .bat (Windows):**
- Doble clic en `start-backend.bat`
- Doble clic en `start-frontend.bat`

## Producción

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

Los archivos de producción estarán en `frontend/dist`

## Notas

- Asegúrate de que MySQL esté corriendo antes de iniciar el backend
- Las tablas se crearán automáticamente la primera vez que inicies el servidor
- El JWT_SECRET debe ser una cadena segura en producción
- Configura las variables de entorno apropiadamente para producción
- Si MySQL tiene contraseña, configúrala en el archivo `.env`

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

