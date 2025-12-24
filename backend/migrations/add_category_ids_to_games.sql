-- Migración: Agregar campo categoryIds a la tabla games
-- Fecha: 2024
-- Descripción: Permite almacenar múltiples IDs de categorías en lugar de solo uno

-- Agregar columna categoryIds (TEXT para almacenar JSON array)
ALTER TABLE games 
ADD COLUMN categoryIds TEXT NULL AFTER categoryId;

-- Nota: Los valores se almacenarán como JSON array, ej: "[1, 2, 3]"
-- El campo categoryId se mantiene para compatibilidad con partidas existentes




