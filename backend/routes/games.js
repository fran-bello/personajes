const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Crear nueva partida
router.post('/create', auth, async (req, res) => {
  try {
    const { characters, timePerRound } = req.body;

    if (!characters || characters.length < 10) {
      return res.status(400).json({ message: 'Se necesitan al menos 10 personajes' });
    }

    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = Game.generateRoomCode();
      exists = await Game.findOne({ roomCode });
    }

    const game = await Game.create({
      roomCode,
      host: req.user._id,
      players: [{
        user: req.user._id,
        team: 1,
        score: 0
      }],
      characters: characters.slice(0, Math.min(characters.length, 100)),
      timePerRound: timePerRound || 60,
      timer: {
        timeLeft: timePerRound || 60,
        isPaused: false
      }
    });

    // Mezclar personajes
    for (let i = game.characters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [game.characters[i], game.characters[j]] = [game.characters[j], game.characters[i]];
    }
    await game.save();

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unirse a partida
router.post('/join', auth, async (req, res) => {
  try {
    const { roomCode } = req.body;

    const game = await Game.findOne({ roomCode }).populate('players.user', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    if (game.status === 'finished') {
      return res.status(400).json({ message: 'Esta partida ya terminó' });
    }

    // Verificar si el usuario ya está en la partida
    const alreadyInGame = game.players.some(p => p.user._id.toString() === req.user._id.toString());
    if (alreadyInGame) {
      return res.json({ game });
    }

    // Asignar equipo (el que tenga menos jugadores)
    const team1Count = game.players.filter(p => p.team === 1).length;
    const team2Count = game.players.filter(p => p.team === 2).length;
    const team = team1Count <= team2Count ? 1 : 2;

    game.players.push({
      user: req.user._id,
      team,
      score: 0
    });

    await game.save();
    await game.populate('players.user', 'username');

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener partida
router.get('/:roomCode', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode })
      .populate('players.user', 'username')
      .populate('host', 'username');

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Iniciar partida
router.post('/:roomCode/start', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    if (game.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el anfitrión puede iniciar la partida' });
    }

    if (game.players.length < 2) {
      return res.status(400).json({ message: 'Se necesitan al menos 2 jugadores' });
    }

    game.status = 'playing';
    game.currentRound = 1;
    game.currentTeam = 1;
    game.currentCharacterIndex = 0;
    game.timer.timeLeft = game.timePerRound;
    game.timer.isPaused = false;

    // Mezclar personajes
    for (let i = game.characters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [game.characters[i], game.characters[j]] = [game.characters[j], game.characters[i]];
    }

    await game.save();
    await game.populate('players.user', 'username');

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Acierto
router.post('/:roomCode/hit', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode });

    if (!game || game.status !== 'playing') {
      return res.status(400).json({ message: 'Partida no disponible' });
    }

    const player = game.players.find(p => p.user.toString() === req.user._id.toString());
    if (!player) {
      return res.status(403).json({ message: 'No estás en esta partida' });
    }

    if (player.team !== game.currentTeam) {
      return res.status(400).json({ message: 'No es el turno de tu equipo' });
    }

    // Incrementar puntuación
    player.score++;
    const roundKey = `round${game.currentRound}`;
    game.roundScores[roundKey][`team${game.currentTeam}`]++;

    // Siguiente personaje
    game.currentCharacterIndex++;

    // Verificar si se terminaron los personajes
    if (game.currentCharacterIndex >= game.characters.length) {
      // Cambiar de equipo o ronda
      if (game.currentTeam === 2) {
        // Ambos equipos terminaron, siguiente ronda
        if (game.currentRound < 3) {
          game.currentRound++;
          game.currentTeam = 1;
          game.currentCharacterIndex = 0;
          // Mezclar personajes
          for (let i = game.characters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.characters[i], game.characters[j]] = [game.characters[j], game.characters[i]];
          }
        } else {
          // Juego terminado
          game.status = 'finished';
        }
      } else {
        // Cambiar al equipo 2
        game.currentTeam = 2;
        game.currentCharacterIndex = 0;
        // Mezclar personajes
        for (let i = game.characters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [game.characters[i], game.characters[j]] = [game.characters[j], game.characters[i]];
        }
      }
    }

    await game.save();
    await game.populate('players.user', 'username');

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pasar
router.post('/:roomCode/pass', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode });

    if (!game || game.status !== 'playing') {
      return res.status(400).json({ message: 'Partida no disponible' });
    }

    const player = game.players.find(p => p.user.toString() === req.user._id.toString());
    if (!player) {
      return res.status(403).json({ message: 'No estás en esta partida' });
    }

    if (player.team !== game.currentTeam) {
      return res.status(400).json({ message: 'No es el turno de tu equipo' });
    }

    // Siguiente personaje
    game.currentCharacterIndex++;

    // Verificar si se terminaron los personajes
    if (game.currentCharacterIndex >= game.characters.length) {
      // Cambiar de equipo o ronda
      if (game.currentTeam === 2) {
        // Ambos equipos terminaron, siguiente ronda
        if (game.currentRound < 3) {
          game.currentRound++;
          game.currentTeam = 1;
          game.currentCharacterIndex = 0;
          // Mezclar personajes
          for (let i = game.characters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [game.characters[i], game.characters[j]] = [game.characters[j], game.characters[i]];
          }
        } else {
          // Juego terminado
          game.status = 'finished';
        }
      } else {
        // Cambiar al equipo 2
        game.currentTeam = 2;
        game.currentCharacterIndex = 0;
        // Mezclar personajes
        for (let i = game.characters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [game.characters[i], game.characters[j]] = [game.characters[j], game.characters[i]];
        }
      }
    }

    await game.save();
    await game.populate('players.user', 'username');

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar timer
router.post('/:roomCode/timer', auth, async (req, res) => {
  try {
    const { timeLeft, isPaused } = req.body;
    const game = await Game.findOne({ roomCode: req.params.roomCode });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    if (timeLeft !== undefined) game.timer.timeLeft = timeLeft;
    if (isPaused !== undefined) game.timer.isPaused = isPaused;

    await game.save();

    res.json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

