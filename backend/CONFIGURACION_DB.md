# Configuración de Base de Datos

## Aclaración importante

- **phpMyAdmin** (puerto 8080): Es solo la interfaz web para administrar MySQL
- **MySQL** (puerto 3306): Es el servidor de base de datos al que se conecta tu aplicación

## Configuración del archivo .env

### Opción 1: MySQL en Docker con nombre de servicio "mysql"
```env
DB_HOST=mysql              # Nombre del servicio en docker-compose
DB_PORT=3306
DB_NAME=personajes
DB_USER=root
DB_PASSWORD=root
```

### Opción 2: MySQL expuesto en localhost
```env
DB_HOST=localhost          # MySQL está expuesto en localhost
DB_PORT=3306
DB_NAME=personajes
DB_USER=root
DB_PASSWORD=root
```

### Opción 3: MySQL en contenedor Docker pero accesible desde host
Si MySQL está en Docker pero el puerto 3306 está mapeado a localhost:
```env
DB_HOST=localhost          # Desde el host, MySQL está en localhost
DB_PORT=3306               # O el puerto mapeado (ej: 3307 si está mapeado así)
DB_NAME=personajes
DB_USER=root
DB_PASSWORD=root
```

## ¿Cómo saber qué usar?

1. **Si usas docker-compose.yml:**
   - Busca el servicio de MySQL
   - El nombre del servicio será tu `DB_HOST`
   - Ejemplo: si el servicio se llama `mysql`, usa `DB_HOST=mysql`

2. **Si MySQL está expuesto en localhost:**
   - Verifica que el puerto 3306 esté mapeado: `docker ps` (busca `0.0.0.0:3306->3306/tcp`)
   - Si está mapeado, usa `DB_HOST=localhost`

3. **Para probar la conexión:**
   ```bash
   # Desde tu máquina local
   mysql -h localhost -P 3306 -u root -p
   
   # O desde dentro del contenedor (si DB_HOST=mysql)
   docker exec -it nombre_contenedor_mysql mysql -u root -p
   ```

## Resumen

- **NO uses** `localhost:8080` - Ese es phpMyAdmin, no MySQL
- **USA** `mysql` si MySQL está en Docker con ese nombre de servicio
- **USA** `localhost` si MySQL está expuesto en el puerto 3306 del host
- **El puerto siempre es** `3306` (a menos que esté mapeado a otro puerto)

