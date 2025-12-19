-- =============================================
-- SCRIPT COMPLETO DE CREACIÓN DE TABLAS
-- Ejecuta este script ANTES del seed de categorías
-- =============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS personajes 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE personajes;

-- =============================================
-- TABLA: users
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NULL,
  `googleId` VARCHAR(255) NULL,
  `avatar` VARCHAR(500) NULL,
  `authProvider` ENUM('local', 'google') DEFAULT 'local',
  `characters` TEXT NULL,
  `gamesPlayed` INT DEFAULT 0,
  `gamesWon` INT DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `googleId` (`googleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: categories
-- =============================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `icon` VARCHAR(10) DEFAULT '📚',
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: characters
-- =============================================
CREATE TABLE IF NOT EXISTS `characters` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `categoryId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `characters_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: games
-- =============================================
CREATE TABLE IF NOT EXISTS `games` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `roomCode` VARCHAR(6) NOT NULL,
  `hostId` INT NOT NULL,
  `players` TEXT NULL,
  `playerCharacters` TEXT NULL,
  `playerAvatars` TEXT NULL,
  `characters` TEXT NOT NULL,
  `currentRound` INT DEFAULT 1,
  `currentTeam` INT DEFAULT 1,
  `currentCharacterIndex` INT DEFAULT 0,
  `timePerRound` INT DEFAULT 60,
  `numPlayers` INT DEFAULT 4,
  `gameMode` ENUM('teams', 'pairs') DEFAULT 'teams',
  `charactersPerPlayer` INT DEFAULT 2,
  `status` ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
  `roundScores` TEXT NULL,
  `timer` TEXT NULL,
  `roundCharacters` TEXT NULL,
  `blockedCharacters` TEXT NULL,
  `playerStats` TEXT NULL,
  `currentPlayerIndex` INT DEFAULT 0,
  `waitingForPlayer` BOOLEAN DEFAULT FALSE,
  `showingRoundIntro` BOOLEAN DEFAULT FALSE,
  `showingRoundIntroMidTurn` BOOLEAN DEFAULT FALSE,
  `categoryId` INT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roomCode` (`roomCode`),
  KEY `hostId` (`hostId`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `games_ibfk_1` FOREIGN KEY (`hostId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `games_ibfk_2` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================

-- Verificar que las tablas se crearon correctamente
SHOW TABLES;
