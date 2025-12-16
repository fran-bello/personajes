const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    team: {
      type: Number,
      enum: [1, 2],
      default: 1
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  characters: [{
    type: String,
    required: true
  }],
  currentRound: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  currentTeam: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  currentCharacterIndex: {
    type: Number,
    default: 0
  },
  timePerRound: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  roundScores: {
    round1: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },
    round2: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    },
    round3: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 }
    }
  },
  timer: {
    timeLeft: {
      type: Number,
      default: 60
    },
    isPaused: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Generar código de sala único
gameSchema.statics.generateRoomCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = mongoose.model('Game', gameSchema);

