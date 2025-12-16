-- Script SQL para crear la base de datos desde phpMyAdmin
-- Copia y pega este código en la pestaña "SQL" de phpMyAdmin

CREATE DATABASE IF NOT EXISTS personajes 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Las tablas (users y games) se crearán automáticamente
-- cuando inicies el servidor backend por primera vez
-- gracias a Sequelize sync

