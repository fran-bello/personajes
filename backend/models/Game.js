const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roomCode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('roomCode', value.toUpperCase());
    }
  },
  hostId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  players: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('players');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('players', JSON.stringify(value));
    }
  },
  playerCharacters: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('playerCharacters');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('playerCharacters', JSON.stringify(value));
    }
  },
  characters: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('characters');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('characters', JSON.stringify(value));
    }
  },
  currentRound: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      isIn: [[1, 2, 3]]
    }
  },
  currentTeam: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      isIn: [[1, 2]]
    }
  },
  currentCharacterIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  timePerRound: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  numPlayers: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  gameMode: {
    type: DataTypes.ENUM('teams', 'pairs'),
    defaultValue: 'teams'
  },
  charactersPerPlayer: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  status: {
    type: DataTypes.ENUM('waiting', 'playing', 'finished'),
    defaultValue: 'waiting'
  },
  roundScores: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('roundScores');
      return value ? JSON.parse(value) : {
        round1: { team1: 0, team2: 0 },
        round2: { team1: 0, team2: 0 },
        round3: { team1: 0, team2: 0 }
      };
    },
    set(value) {
      this.setDataValue('roundScores', JSON.stringify(value));
    }
  },
  timer: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('timer');
      return value ? JSON.parse(value) : { timeLeft: 60, isPaused: false };
    },
    set(value) {
      this.setDataValue('timer', JSON.stringify(value));
    }
  }
}, {
  tableName: 'games',
  timestamps: true
});

// Relaciones
Game.belongsTo(User, { foreignKey: 'hostId', as: 'host' });

// Método estático para generar código de sala
Game.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = Game;
