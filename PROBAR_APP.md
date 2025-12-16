# 🚀 Cómo Probar la Aplicación

## Pasos para iniciar la aplicación

### 1. Crear la base de datos (si no la creaste)

Abre phpMyAdmin en `http://localhost:8080` y crea la base de datos `personajes`:
- Haz clic en "Nueva" o "New"
- Nombre: `personajes`
- Intercalación: `utf8mb4_unicode_ci`
- Haz clic en "Crear"

### 2. Instalar dependencias del backend

Abre una terminal y ejecuta:

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

Abre otra terminal y ejecuta:

```bash
cd frontend
npm install
```

### 4. Iniciar el backend

En la terminal del backend:

```bash
cd backend
npm run dev
```

Deberías ver:
```
MySQL conectado correctamente.
Modelos sincronizados.
Servidor corriendo en puerto 3001
```

**Nota:** Las tablas se crearán automáticamente la primera vez.

### 5. Iniciar el frontend

En la terminal del frontend:

```bash
cd frontend
npm run dev
```

Deberías ver:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 6. Abrir la aplicación

Abre tu navegador en: **http://localhost:5173**

## Probar la aplicación

1. **Registrarse:**
   - Haz clic en "Regístrate aquí"
   - Completa el formulario (usuario, email, contraseña)
   - Deberías ser redirigido al Dashboard

2. **Agregar personajes:**
   - Ve a "Gestionar Personajes"
   - Agrega al menos 10 personajes
   - Ejemplo: Batman, Superman, Spider-Man, etc.

3. **Crear una partida:**
   - Ve a "Crear Partida"
   - Selecciona los personajes y tiempo
   - Haz clic en "Crear Partida"
   - Copia el código de sala

4. **Unirse a la partida (en otra pestaña/navegador):**
   - Registra otro usuario
   - Usa el código de sala para unirte

5. **Jugar:**
   - El anfitrión inicia la partida
   - ¡A jugar!

## Solución de problemas

### Error de conexión a MySQL
- Verifica que MySQL esté corriendo: `docker ps`
- Verifica las credenciales en `backend/.env`
- Verifica que la base de datos `personajes` exista

### Error al iniciar el backend
- Verifica que el puerto 3001 no esté en uso
- Verifica que el archivo `.env` exista en `backend/`

### Error al iniciar el frontend
- Verifica que el puerto 5173 no esté en uso
- Verifica que hayas instalado las dependencias

## Comandos rápidos

**Instalar todo:**
```bash
.\install-all.bat
```

**Iniciar backend:**
```bash
.\start-backend.bat
```

**Iniciar frontend:**
```bash
.\start-frontend.bat
```

