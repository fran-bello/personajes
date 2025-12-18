# Migración: Agregar campo showingRoundIntroMidTurn

## Problema
Error: `Unknown column 'showingRoundIntroMidTurn' in 'field list'`

## Solución
Ejecuta el script SQL `add_showing_round_intro_mid_turn.sql` en tu base de datos MySQL.

## Opción 1: Desde phpMyAdmin (Recomendado)

1. Abre phpMyAdmin en `http://localhost:8080` (o tu puerto configurado)
2. Selecciona la base de datos `personajes` en el panel izquierdo
3. Haz clic en la pestaña **"SQL"** en la parte superior
4. Copia y pega el contenido del archivo `add_showing_round_intro_mid_turn.sql`
5. Haz clic en **"Continuar"** o **"Go"**

## Opción 2: Desde línea de comandos MySQL

```bash
mysql -u root -p personajes < backend/migrations/add_showing_round_intro_mid_turn.sql
```

O si estás dentro de MySQL:

```sql
USE personajes;
SOURCE backend/migrations/add_showing_round_intro_mid_turn.sql;
```

## Opción 3: Ejecutar SQL directamente

Si prefieres ejecutar el SQL directamente, ejecuta este comando en MySQL:

```sql
USE personajes;

ALTER TABLE games ADD COLUMN showingRoundIntroMidTurn BOOLEAN DEFAULT FALSE;
```

## Verificar

Después de ejecutar la migración, verifica que la columna fue agregada:

```sql
USE personajes;
DESCRIBE games;
```

Deberías ver la columna `showingRoundIntroMidTurn` en la lista.
