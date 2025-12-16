# Configuración de MySQL con Docker

## Crear la base de datos desde phpMyAdmin

### Paso 1: Acceder a phpMyAdmin
1. Abre tu navegador y ve a: `http://localhost:8080`
2. Inicia sesión con tus credenciales de MySQL:
   - **Usuario**: `root` (o el usuario configurado en tu Docker)
   - **Contraseña**: (la que configuraste en Docker, o vacía si no tiene)

### Paso 2: Crear la base de datos
1. En el panel izquierdo, haz clic en **"Nueva"** o **"New"**
2. En el campo **"Nombre de la base de datos"**, escribe: `personajes`
3. Selecciona la intercalación: `utf8mb4_unicode_ci` (o `utf8mb4_general_ci`)
4. Haz clic en **"Crear"** o **"Create"**

### Paso 3: Verificar la creación
- Deberías ver la base de datos `personajes` en el panel izquierdo
- **¡Listo!** Las tablas se crearán automáticamente cuando inicies el backend

## Configuración del archivo .env

### Si MySQL está en Docker (mismo contenedor o red Docker)

**Opción A - Si MySQL está en el mismo contenedor o red Docker:**
```env
DB_HOST=localhost          # O el nombre del servicio MySQL en docker-compose
DB_PORT=3306
DB_NAME=personajes
DB_USER=root
DB_PASSWORD=tu_contraseña   # La que configuraste en Docker
```

**Opción B - Si MySQL está en un contenedor separado:**
Necesitas usar el nombre del servicio o IP del contenedor:
```env
DB_HOST=mysql              # Nombre del servicio en docker-compose
# O
DB_HOST=172.17.0.1        # IP del contenedor MySQL
DB_PORT=3306
DB_NAME=personajes
DB_USER=root
DB_PASSWORD=tu_contraseña
```

### Verificar la configuración de Docker

Para saber qué host usar, puedes:

1. **Ver los contenedores corriendo:**
   ```bash
   docker ps
   ```

2. **Ver la red Docker:**
   ```bash
   docker network ls
   docker network inspect nombre_de_la_red
   ```

3. **Si usas docker-compose, revisa el archivo `docker-compose.yml`:**
   - El nombre del servicio MySQL será el `DB_HOST`
   - Ejemplo: si el servicio se llama `mysql`, usa `DB_HOST=mysql`

## Probar la conexión

Una vez configurado el `.env`, inicia el backend:

```bash
cd backend
npm run dev
```

Deberías ver:
```
MySQL conectado correctamente.
Modelos sincronizados.
```

Si hay errores de conexión, verifica:
- Que MySQL esté corriendo: `docker ps`
- Que el puerto 3306 esté expuesto correctamente
- Que las credenciales en `.env` coincidan con las de Docker

