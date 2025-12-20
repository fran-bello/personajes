-- Ejecutar este script en tu base de datos MySQL
-- Opción 1: Copiar y pegar en phpMyAdmin (http://localhost:8080)
-- Opción 2: Ejecutar desde HeidiSQL o cualquier cliente MySQL

USE personajes;

-- Verificar si la columna ya existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = "games";
SET @columnname = "categoryIds";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'La columna categoryIds ya existe' AS resultado;",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT NULL AFTER categoryId;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Migración completada. La columna categoryIds ha sido agregada a la tabla games.' AS resultado;
