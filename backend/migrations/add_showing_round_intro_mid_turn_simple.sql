-- Migración simple: Agregar campo showingRoundIntroMidTurn a la tabla games
-- Ejecuta este script en MySQL

USE personajes;

-- Agregar la columna si no existe
ALTER TABLE games ADD COLUMN showingRoundIntroMidTurn BOOLEAN DEFAULT FALSE;
