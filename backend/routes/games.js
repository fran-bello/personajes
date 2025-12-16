const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper para formatear game con usuarios
const formatGame = async (game, req = null) => {
  const host = await User.findByPk(game.hostId, { attributes: ['id', 'username'] });
  const players = game.players || [];
  
  // Obtener información de usuarios para los players
  const playersWithUsers = await Promise.all(
    players.map(async (player) => {
      const user = await User.findByPk(player.user, { attributes: ['id', 'username'] });
      return {
        user: user ? { _id: user.id, username: user.username } : { _id: player.user, username: 'Usuario' },
        team: player.team,
        score: player.score
      };
    })
  );

  // Solo devolver los personajes del usuario actual
  const playerCharacters = game.playerCharacters || {};
  const filteredPlayerCharacters = {};
  
  // Si hay un usuario en la request, solo mostrar sus personajes
  if (req && req.user) {
    filteredPlayerCharacters[req.user.id] = playerCharacters[req.user.id] || [];
  }

  return {
    ...game.toJSON(),
    host: host ? { _id: host.id, username: host.username } : null,
    players: playersWithUsers,
    playerCharacters: filteredPlayerCharacters // Solo los personajes del usuario actual
  };
};

// Crear nueva partida
router.post('/create', auth, async (req, res) => {
  try {
    const { characters, timePerRound, numPlayers, gameMode, charactersPerPlayer } = req.body;

    // Validar número de jugadores
    if (!numPlayers || numPlayers < 2) {
      return res.status(400).json({ message: 'Debe haber al menos 2 jugadores' });
    }

    // Validar personajes del anfitrión
    if (!characters || !Array.isArray(characters)) {
      return res.status(400).json({ message: 'Debes ingresar personajes' });
    }

    const charsPerPlayer = charactersPerPlayer || 2;
    if (characters.length !== charsPerPlayer) {
      return res.status(400).json({ message: `Debes ingresar exactamente ${charsPerPlayer} personajes` });
    }

    // Validar que los personajes no estén vacíos y sean únicos
    const trimmedChars = characters.map(c => c?.trim()).filter(c => c);
    if (trimmedChars.length !== charsPerPlayer) {
      return res.status(400).json({ message: 'Los personajes no pueden estar vacíos' });
    }

    // Verificar que no haya duplicados
    const uniqueChars = [...new Set(trimmedChars)];
    if (uniqueChars.length !== trimmedChars.length) {
      return res.status(400).json({ message: 'Los personajes deben ser diferentes' });
    }

    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = Game.generateRoomCode();
      const existing = await Game.findOne({ where: { roomCode } });
      exists = !!existing;
    }

    // Guardar los personajes del anfitrión
    const playerCharacters = {
      [req.user.id]: trimmedChars
    };

    const game = await Game.create({
      roomCode,
      hostId: req.user.id,
      players: [{
        user: req.user.id,
        team: 1,
        score: 0
      }],
      characters: trimmedChars, // Personajes iniciales
      playerCharacters: playerCharacters,
      numPlayers: numPlayers,
      gameMode: gameMode || 'teams',
      charactersPerPlayer: charsPerPlayer,
      timePerRound: timePerRound || 60,
      timer: {
        timeLeft: timePerRound || 60,
        isPaused: false
      }
    });

    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unirse a partida
router.post('/join', auth, async (req, res) => {
  try {
    const { roomCode, characters } = req.body;

    const game = await Game.findOne({ where: { roomCode } });
    
    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    if (game.status === 'finished') {
      return res.status(400).json({ message: 'Esta partida ya terminó' });
    }

    const players = game.players || [];
    const playerCharacters = game.playerCharacters || {};
    
    // Verificar si el usuario ya está en la partida
    const alreadyInGame = players.some(p => p.user === req.user.id);
    
    if (alreadyInGame) {
      // Si ya está en la partida pero no ha aportado personajes, permitir agregarlos
      if (!playerCharacters[req.user.id] && characters) {
        if (!Array.isArray(characters) || characters.length !== 2) {
          return res.status(400).json({ message: 'Debes ingresar exactamente 2 personajes' });
        }
        
        const char1 = characters[0]?.trim();
        const char2 = characters[1]?.trim();
        
        if (!char1 || !char2 || char1 === char2) {
          return res.status(400).json({ message: 'Los personajes deben ser diferentes y no estar vacíos' });
        }

        // Agregar personajes del jugador
        playerCharacters[req.user.id] = [char1, char2];
        const allCharacters = game.characters || [];
        allCharacters.push(char1, char2);
        
        await game.update({ 
          characters: allCharacters,
          playerCharacters: playerCharacters
        });
      }
      
      const formattedGame = await formatGame(game);
      return res.json({ game: formattedGame });
    }

    // Si el jugador aporta personajes al unirse
    if (characters) {
      const charsPerPlayer = game.charactersPerPlayer || 2;
      if (!Array.isArray(characters) || characters.length !== charsPerPlayer) {
        return res.status(400).json({ message: `Debes ingresar exactamente ${charsPerPlayer} personajes` });
      }
      
      const trimmedChars = characters.map(c => c?.trim()).filter(c => c);
      if (trimmedChars.length !== charsPerPlayer) {
        return res.status(400).json({ message: 'Los personajes no pueden estar vacíos' });
      }

      // Verificar que no haya duplicados
      const uniqueChars = [...new Set(trimmedChars)];
      if (uniqueChars.length !== trimmedChars.length) {
        return res.status(400).json({ message: 'Los personajes deben ser diferentes' });
      }

      playerCharacters[req.user.id] = trimmedChars;
    }

    // Asignar equipo (el que tenga menos jugadores)
    const team1Count = players.filter(p => p.team === 1).length;
    const team2Count = players.filter(p => p.team === 2).length;
    const team = team1Count <= team2Count ? 1 : 2;

    players.push({
      user: req.user.id,
      team,
      score: 0
    });

    // Agregar personajes al pool si se proporcionaron
    const allCharacters = game.characters || [];
    if (characters) {
      const trimmedChars = characters.map(c => c.trim());
      allCharacters.push(...trimmedChars);
    }

    await game.update({ 
      players,
      characters: allCharacters,
      playerCharacters: playerCharacters
    });

    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener partida
router.get('/:roomCode', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Iniciar partida
router.post('/:roomCode/start', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    if (game.hostId !== req.user.id) {
      return res.status(403).json({ message: 'Solo el anfitrión puede iniciar la partida' });
    }

    const players = game.players || [];
    const characters = game.characters || [];
    
    if (players.length < 2) {
      return res.status(400).json({ message: 'Se necesitan al menos 2 jugadores' });
    }

    // Verificar que todos los jugadores hayan aportado sus personajes
    const playerCharacters = game.playerCharacters || {};
    const charsPerPlayer = game.charactersPerPlayer || 2;
    const playersWithoutCharacters = players.filter(p => !playerCharacters[p.user] || playerCharacters[p.user].length !== charsPerPlayer);
    if (playersWithoutCharacters.length > 0) {
      return res.status(400).json({ 
        message: `Todos los jugadores deben aportar sus ${charsPerPlayer} personaje${charsPerPlayer !== 1 ? 's' : ''} antes de iniciar` 
      });
    }

    const minCharacters = game.numPlayers * (game.charactersPerPlayer || 2);
    if (characters.length < minCharacters) {
      return res.status(400).json({ 
        message: `Se necesitan al menos ${minCharacters} personajes para iniciar (${game.charactersPerPlayer || 2} por jugador)` 
      });
    }

    if (players.length < game.numPlayers) {
      return res.status(400).json({ 
        message: `Se necesitan ${game.numPlayers} jugadores para iniciar. Actualmente hay ${players.length}` 
      });
    }

    // Mezclar personajes
    const shuffled = [...characters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    await game.update({
      status: 'playing',
      currentRound: 1,
      currentTeam: 1,
      currentCharacterIndex: 0,
      characters: shuffled,
      timer: {
        timeLeft: game.timePerRound,
        isPaused: false
      }
    });

    await game.reload();
    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Acierto
router.post('/:roomCode/hit', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game || game.status !== 'playing') {
      return res.status(400).json({ message: 'Partida no disponible' });
    }

    const players = game.players || [];
    const player = players.find(p => p.user === req.user.id);
    if (!player) {
      return res.status(403).json({ message: 'No estás en esta partida' });
    }

    if (player.team !== game.currentTeam) {
      return res.status(400).json({ message: 'No es el turno de tu equipo' });
    }

    // Incrementar puntuación
    player.score++;
    const roundScores = game.roundScores || {
      round1: { team1: 0, team2: 0 },
      round2: { team1: 0, team2: 0 },
      round3: { team1: 0, team2: 0 }
    };
    const roundKey = `round${game.currentRound}`;
    roundScores[roundKey][`team${game.currentTeam}`]++;

    // Siguiente personaje
    let newIndex = game.currentCharacterIndex + 1;
    let newRound = game.currentRound;
    let newTeam = game.currentTeam;
    let newStatus = game.status;
    const characters = game.characters || [];

    // Verificar si se terminaron los personajes
    if (newIndex >= characters.length) {
      // Cambiar de equipo o ronda
      if (game.currentTeam === 2) {
        // Ambos equipos terminaron, siguiente ronda
        if (game.currentRound < 3) {
          newRound = game.currentRound + 1;
          newTeam = 1;
          newIndex = 0;
          // Mezclar personajes
          for (let i = characters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [characters[i], characters[j]] = [characters[j], characters[i]];
          }
        } else {
          // Juego terminado
          newStatus = 'finished';
        }
      } else {
        // Cambiar al equipo 2
        newTeam = 2;
        newIndex = 0;
        // Mezclar personajes
        for (let i = characters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [characters[i], characters[j]] = [characters[j], characters[i]];
        }
      }
    }

    await game.update({
      players,
      roundScores,
      currentCharacterIndex: newIndex,
      currentRound: newRound,
      currentTeam: newTeam,
      status: newStatus,
      characters
    });

    await game.reload();
    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pasar
router.post('/:roomCode/pass', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game || game.status !== 'playing') {
      return res.status(400).json({ message: 'Partida no disponible' });
    }

    const players = game.players || [];
    const player = players.find(p => p.user === req.user.id);
    if (!player) {
      return res.status(403).json({ message: 'No estás en esta partida' });
    }

    if (player.team !== game.currentTeam) {
      return res.status(400).json({ message: 'No es el turno de tu equipo' });
    }

    // Siguiente personaje
    let newIndex = game.currentCharacterIndex + 1;
    let newRound = game.currentRound;
    let newTeam = game.currentTeam;
    let newStatus = game.status;
    const characters = game.characters || [];

    // Verificar si se terminaron los personajes
    if (newIndex >= characters.length) {
      // Cambiar de equipo o ronda
      if (game.currentTeam === 2) {
        // Ambos equipos terminaron, siguiente ronda
        if (game.currentRound < 3) {
          newRound = game.currentRound + 1;
          newTeam = 1;
          newIndex = 0;
          // Mezclar personajes
          for (let i = characters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [characters[i], characters[j]] = [characters[j], characters[i]];
          }
        } else {
          // Juego terminado
          newStatus = 'finished';
        }
      } else {
        // Cambiar al equipo 2
        newTeam = 2;
        newIndex = 0;
        // Mezclar personajes
        for (let i = characters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [characters[i], characters[j]] = [characters[j], characters[i]];
        }
      }
    }

    await game.update({
      currentCharacterIndex: newIndex,
      currentRound: newRound,
      currentTeam: newTeam,
      status: newStatus,
      characters
    });

    await game.reload();
    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar timer
router.post('/:roomCode/timer', auth, async (req, res) => {
  try {
    const { timeLeft, isPaused } = req.body;
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    const timer = game.timer || { timeLeft: 60, isPaused: false };
    if (timeLeft !== undefined) timer.timeLeft = timeLeft;
    if (isPaused !== undefined) timer.isPaused = isPaused;

    await game.update({ timer });
    await game.reload();

    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
