# 🗄️ Configuración de TiDB Cloud - Paso a Paso

Esta guía te ayudará a configurar tu base de datos en TiDB Cloud para producción.

## 📋 Pasos

### 1. Crear Cluster en TiDB Cloud

1. Ve a [tidbcloud.com](https://tidbcloud.com)
2. Crea cuenta (puedes usar GitHub)
3. Crea un nuevo cluster **Serverless** (gratis)
4. Elige la región más cercana
5. Espera a que se cree (1-2 minutos)

### 2. Obtener Credenciales

1. Haz clic en tu cluster
2. Ve a la pestaña **"Connect"**
3. Selecciona **"Node.js"** como lenguaje
4. Copia estas credenciales:
   - `DB_HOST`: ejemplo: `gateway01.us-west-2.prod.aws.tidbcloud.com`
   - `DB_PORT`: `4000` ⚠️ **NO 3306**
   - `DB_USER`: tu usuario
   - `DB_PASSWORD`: tu contraseña
   - `DB_NAME`: nombre de tu cluster

### 3. Crear Tablas

**Opción A: SQL Editor de TiDB Cloud**

1. En el dashboard, haz clic en tu cluster
2. Ve a **"SQL Editor"** o **"Chat2Query"**
3. Abre el archivo `backend/create_tables.sql`
4. Copia y pega **TODO** el contenido
5. Haz clic en **"Run"** o **"Execute"**
6. Verifica que se crearon 4 tablas: `users`, `categories`, `characters`, `games`

**Opción B: Cliente MySQL**

1. Descarga [DBeaver](https://dbeaver.io/) o [MySQL Workbench](https://www.mysql.com/products/workbench/)
2. Crea nueva conexión:
   - Host: tu `DB_HOST` de TiDB
   - Port: `4000` ⚠️ **NO 3306**
   - Database: tu `DB_NAME`
   - Username: tu `DB_USER`
   - Password: tu `DB_PASSWORD`
   - SSL: **Habilitado** ✅
3. Conéctate
4. Ejecuta el archivo `backend/create_tables.sql`

### 4. Poblar Datos (Seed)

**En el SQL Editor de TiDB Cloud o tu cliente MySQL:**

1. Abre el archivo `backend/seeds/categories_seed.sql`
2. Copia y pega **TODO** el contenido
3. Ejecuta
4. Esto insertará todas las categorías y personajes predefinidos

### 5. Verificar

Ejecuta esta consulta para verificar:

```sql
SELECT 
    c.name as categoria,
    COUNT(ch.id) as total_personajes
FROM categories c
LEFT JOIN characters ch ON c.id = ch.categoryId
GROUP BY c.id, c.name
ORDER BY c.name;
```

Deberías ver todas las categorías con sus personajes.

## ⚠️ Errores Comunes

**Error: "Table doesn't exist"**
- Solución: Ejecuta primero `create_tables.sql`

**Error: "Connection refused"**
- Verifica que el puerto sea `4000` (no 3306)
- Verifica que SSL esté habilitado

**Error: "Access denied"**
- Verifica usuario y contraseña
- Asegúrate de usar las credenciales exactas de TiDB Cloud

## 📝 Notas

- TiDB Cloud usa puerto **4000**, no 3306
- SSL es **obligatorio** en TiDB Cloud
- El plan Serverless es completamente gratis (5 GB)
- Las tablas se crean una sola vez
- El seed se puede ejecutar múltiples veces (usará INSERT, no CREATE)

## 🔗 Archivos Necesarios

1. `backend/create_tables.sql` - Crea todas las tablas
2. `backend/seeds/categories_seed.sql` - Pobla categorías y personajes

## 👀 Ver los Datos

Para ver y consultar los datos en tu base de datos, consulta: **[VER_DATOS_TIDB.md](./VER_DATOS_TIDB.md)**

**Quick start:**
1. Ve a tu cluster en TiDB Cloud
2. Haz clic en **"SQL Editor"**
3. Ejecuta: `SELECT * FROM categories;`

¡Listo! Tu base de datos está configurada. 🎉
