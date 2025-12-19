# 🗄️ Alternativas Gratuitas de MySQL (PlanetScale ya no es gratis)

PlanetScale eliminó su plan gratuito en marzo de 2024. Aquí tienes las mejores alternativas gratuitas:

## ⭐ Opción 1: Railway.app (Recomendado)

**Ventajas:**
- ✅ $5 crédito mensual gratis (suficiente para desarrollo)
- ✅ Muy fácil de usar
- ✅ Interfaz intuitiva
- ✅ No requiere SSL (más simple)
- ✅ Integración con GitHub

**Desventajas:**
- ⚠️ Si excedes $5/mes, tendrás que pagar

**Cómo usar:**
1. Ve a [railway.app](https://railway.app)
2. Crea cuenta (puedes usar GitHub)
3. New Project → New → Database → Add MySQL
4. Copia las credenciales de conexión
5. Configura `DB_SSL=false` en Render

**Límites del plan gratis:**
- $5 crédito mensual
- Suficiente para una base de datos MySQL pequeña/mediana

---

## 🆓 Opción 2: TiDB Serverless (Completamente Gratis)

**Ventajas:**
- ✅ Completamente gratis (sin límite de tiempo)
- ✅ 5 GB por base de datos
- ✅ Hasta 5 bases de datos
- ✅ MySQL-compatible
- ✅ Auto-scaling

**Desventajas:**
- ⚠️ Requiere SSL (ya configurado en el código)
- ⚠️ Usa puerto 4000 (no 3306)

**Cómo usar:**
1. Ve a [tidbcloud.com](https://tidbcloud.com)
2. Crea cuenta (puedes usar GitHub)
3. Create Cluster → Serverless
4. Copia las credenciales
5. Configura `DB_SSL=true` y `DB_PORT=4000` en Render

**Límites del plan gratis:**
- 5 GB por base de datos
- Hasta 5 bases de datos
- Sin límite de tiempo

---

## 🆓 Opción 3: Northflank

**Ventajas:**
- ✅ 2 bases de datos gratis
- ✅ Fácil de usar

**Desventajas:**
- ⚠️ Solo 2 bases de datos en plan gratis

**Cómo usar:**
1. Ve a [northflank.com](https://northflank.com)
2. Crea cuenta gratuita
3. Crea servicio MySQL
4. Obtén credenciales

---

## 📊 Comparación Rápida

| Servicio | Costo | SSL | Puerto | Facilidad | Recomendado |
|----------|-------|-----|--------|-----------|-------------|
| **Railway.app** | $5 crédito/mes | No | 3306 | ⭐⭐⭐⭐⭐ | ⭐ Sí |
| **TiDB Serverless** | Gratis | Sí | 4000 | ⭐⭐⭐⭐ | ⭐ Sí |
| **Northflank** | Gratis | Depende | 3306 | ⭐⭐⭐ | Opcional |

---

## 🔧 Configuración en Render.com

### Para Railway.app:
```
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASSWORD=tu-contraseña
DB_SSL=false
```

### Para TiDB Serverless:
```
DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
DB_PORT=4000
DB_NAME=tu-nombre-cluster
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_SSL=true
```

---

## 💡 Recomendación

**Para empezar rápido:** Usa **Railway.app** - Es la más fácil y el $5 crédito mensual es suficiente para desarrollo.

**Para algo completamente gratis:** Usa **TiDB Serverless** - No tiene límite de tiempo y es completamente gratis.

---

## 🔄 Migrar de PlanetScale

Si ya tenías PlanetScale:

1. Exporta tus datos desde PlanetScale
2. Elige una de las alternativas arriba
3. Crea la nueva base de datos
4. Importa tus datos
5. Actualiza las variables de entorno en Render

---

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [TiDB Serverless Docs](https://docs.pingcap.com/tidbcloud)
- [Northflank Docs](https://docs.northflank.com)
