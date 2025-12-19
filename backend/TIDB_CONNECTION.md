# 🔌 Conexión a TiDB Cloud - Configuración Oficial

Esta guía muestra cómo configurar la conexión a TiDB Cloud según la [documentación oficial](https://docs.pingcap.com/tidbcloud).

## 📋 Variables de Entorno

TiDB Cloud soporta dos formatos de variables de entorno:

### Opción 1: Variables DB_* (Actual)
```
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_NAME=personajes
DB_USER=tu-usuario-de-tidb
DB_PASSWORD=tu-contraseña-de-tidb
DB_SSL=true
```

### Opción 2: Variables TIDB_* (Documentación Oficial)
```
TIDB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_DATABASE=personajes
TIDB_USER=tu-usuario-de-tidb
TIDB_PASSWORD=tu-contraseña-de-tidb
TIDB_ENABLE_SSL=true
```

**Nota**: El código soporta ambas opciones. Si usas `TIDB_*`, tienen prioridad sobre `DB_*`.

## ⚠️ Configuración SSL Obligatoria

Para TiDB Cloud Starter/Essential, **SSL es OBLIGATORIO** cuando usas el endpoint público.

La configuración SSL debe incluir:
```javascript
ssl: {
  minVersion: 'TLSv1.2',
  rejectUnauthorized: false
}
```

Esto ya está configurado en `backend/config/database.js`.

## 🔧 Configuración en Render.com

### Usando variables DB_* (Recomendado para este proyecto):
```
PORT=10000
NODE_ENV=production
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_NAME=personajes
DB_USER=tu-usuario-de-tidb
DB_PASSWORD=tu-contraseña-de-tidb
DB_SSL=true
JWT_SECRET=tu-secreto
FRONTEND_URL=https://tu-app.vercel.app
```

### O usando variables TIDB_* (Documentación oficial):
```
PORT=10000
NODE_ENV=production
TIDB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_DATABASE=personajes
TIDB_USER=tu-usuario-de-tidb
TIDB_PASSWORD=tu-contraseña-de-tidb
TIDB_ENABLE_SSL=true
JWT_SECRET=tu-secreto
FRONTEND_URL=https://tu-app.vercel.app
```

## 📝 Notas Importantes

1. **Puerto**: TiDB Cloud usa puerto **4000**, NO 3306
2. **SSL**: Es **obligatorio** para TiDB Cloud Starter/Essential
3. **TLS Version**: Debe ser mínimo TLSv1.2
4. **CA Certificate**: No es necesario especificar, Node.js usa los certificados de Mozilla por defecto

## 🔍 Verificar Conexión

Una vez configurado, el backend debería conectarse automáticamente. Verifica en los logs:

```
MySQL conectado correctamente.
```

Si ves este mensaje, la conexión está funcionando correctamente.

## 🐛 Solución de Problemas

### Error: "SSL connection required"
- **Solución**: Verifica que `DB_SSL=true` o `TIDB_ENABLE_SSL=true` esté configurado

### Error: "Connection refused"
- **Solución**: Verifica que el puerto sea `4000` (no 3306)

### Error: "Access denied"
- **Solución**: Verifica usuario y contraseña exactos de TiDB Cloud

## 📚 Referencias

- [Documentación oficial de TiDB Cloud](https://docs.pingcap.com/tidbcloud)
- [node-mysql2 con TiDB](https://docs.pingcap.com/tidbcloud/dev-guide-sample-app-nodejs-mysql2)
