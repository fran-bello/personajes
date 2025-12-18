-- Migración: Agregar campo showingRoundIntroMidTurn a la tabla games
-- Ejecuta este script en MySQL si la tabla games ya existe

USE personajes;

-- Verificar si la columna ya existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = 'games';
SET @columnname = 'showingRoundIntroMidTurn';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT "La columna showingRoundIntroMidTurn ya existe en la tabla games" AS message;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT "Migración completada: Campo showingRoundIntroMidTurn agregado a la tabla games" AS message;
