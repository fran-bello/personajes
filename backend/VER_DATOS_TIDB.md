# 👀 Cómo Ver los Datos en TiDB Cloud

Hay varias formas de ver y consultar los datos en tu base de datos de TiDB Cloud.

## 🎯 Opción 1: SQL Editor de TiDB Cloud (Más Fácil)

### Ver todas las tablas:
```sql
SHOW TABLES;
```

### Ver todas las categorías:
```sql
SELECT * FROM categories;
```

### Ver todos los personajes:
```sql
SELECT * FROM characters;
```

### Ver categorías con conteo de personajes:
```sql
SELECT 
    c.id,
    c.name as categoria,
    c.icon,
    COUNT(ch.id) as total_personajes
FROM categories c
LEFT JOIN characters ch ON c.id = ch.categoryId
GROUP BY c.id, c.name, c.icon
ORDER BY c.name;
```

### Ver personajes de una categoría específica:
```sql
-- Ejemplo: Ver personajes de Harry Potter (ID: 1)
SELECT * FROM characters WHERE categoryId = 1;
```

### Ver usuarios registrados:
```sql
SELECT id, username, email, gamesPlayed, gamesWon, createdAt 
FROM users;
```

### Ver partidas activas:
```sql
SELECT id, roomCode, hostId, status, currentRound, numPlayers, createdAt 
FROM games 
ORDER BY createdAt DESC;
```

### Ver estadísticas generales:
```sql
-- Total de categorías
SELECT COUNT(*) as total_categorias FROM categories;

-- Total de personajes
SELECT COUNT(*) as total_personajes FROM characters;

-- Total de usuarios
SELECT COUNT(*) as total_usuarios FROM users;

-- Total de partidas
SELECT COUNT(*) as total_partidas FROM games;
```

## 🔧 Opción 2: Cliente MySQL (DBeaver, MySQL Workbench, etc.)

### Configuración de Conexión:
- **Host**: Tu `DB_HOST` de TiDB Cloud
- **Port**: `4000` ⚠️ **NO 3306**
- **Database**: Tu `DB_NAME`
- **Username**: Tu `DB_USER`
- **Password**: Tu `DB_PASSWORD`
- **SSL**: **Habilitado** ✅

### Una vez conectado:
1. Expande tu base de datos en el panel izquierdo
2. Verás todas las tablas: `users`, `categories`, `characters`, `games`
3. Haz clic derecho en cualquier tabla → **"View Data"** o **"Select Top 1000 Rows"**
4. O escribe queries SQL en el editor

## 🌐 Opción 3: Desde el Backend (Render)

Si tu backend está deployado en Render, puedes probar los endpoints:

### Ver categorías:
```
GET https://tu-backend.onrender.com/api/categories
```

### Ver una categoría específica:
```
GET https://tu-backend.onrender.com/api/categories/1
```

### Ver personajes (requiere autenticación):
```
GET https://tu-backend.onrender.com/api/characters
Authorization: Bearer tu-token-jwt
```

## 📊 Queries Útiles

### Top 10 categorías con más personajes:
```sql
SELECT 
    c.name as categoria,
    COUNT(ch.id) as total_personajes
FROM categories c
LEFT JOIN characters ch ON c.id = ch.categoryId
GROUP BY c.id, c.name
ORDER BY total_personajes DESC
LIMIT 10;
```

### Ver personajes de Marvel:
```sql
SELECT ch.name 
FROM characters ch
JOIN categories c ON ch.categoryId = c.id
WHERE c.name = 'Marvel'
ORDER BY ch.name;
```

### Ver usuarios más activos:
```sql
SELECT username, gamesPlayed, gamesWon, createdAt
FROM users
ORDER BY gamesPlayed DESC
LIMIT 10;
```

### Ver partidas por estado:
```sql
SELECT 
    status,
    COUNT(*) as cantidad
FROM games
GROUP BY status;
```

## 🎨 Usando el SQL Editor de TiDB Cloud

1. Ve a [tidbcloud.com](https://tidbcloud.com)
2. Haz clic en tu cluster
3. Ve a la pestaña **"SQL Editor"** o **"Chat2Query"**
4. Escribe tu query SQL
5. Haz clic en **"Run"** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
6. Verás los resultados en una tabla debajo

## 💡 Tips

- **Chat2Query**: TiDB Cloud tiene un asistente de IA que puede ayudarte a escribir queries
- **Exportar datos**: Puedes exportar los resultados como CSV desde el SQL Editor
- **Historial**: El SQL Editor guarda tu historial de queries
- **Favoritos**: Puedes guardar queries frecuentes

## 🔍 Verificar que los datos se insertaron correctamente

Ejecuta esta query para verificar que todo está bien:

```sql
SELECT 
    'Categorías' as tabla,
    COUNT(*) as total
FROM categories
UNION ALL
SELECT 
    'Personajes' as tabla,
    COUNT(*) as total
FROM characters
UNION ALL
SELECT 
    'Usuarios' as tabla,
    COUNT(*) as total
FROM users
UNION ALL
SELECT 
    'Partidas' as tabla,
    COUNT(*) as total
FROM games;
```

Deberías ver algo como:
- Categorías: ~35
- Personajes: ~1100+
- Usuarios: 0 (hasta que alguien se registre)
- Partidas: 0 (hasta que alguien cree una)

¡Listo! Ahora puedes explorar tus datos fácilmente. 🎉
