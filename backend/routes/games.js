const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const { Category, Character } = require('../models');
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

  // Obtener información de la categoría si existe
  let categoryInfo = null;
  if (game.categoryId) {
    const category = await Category.findByPk(game.categoryId, {
      attributes: ['id', 'name', 'icon']
    });
    if (category) {
      categoryInfo = {
        id: category.id,
        name: category.name,
        icon: category.icon
      };
    }
  }

  const usesCategory = game.categoryId != null || game.charactersPerPlayer === 0;

  return {
    ...game.toJSON(),
    host: host ? { _id: host.id, username: host.username } : null,
    players: playersWithUsers,
    playerCharacters: filteredPlayerCharacters, // Solo los personajes del usuario actual
    playerStats: game.playerStats || {},
    roundCharacters: game.roundCharacters || [],
    blockedCharacters: game.blockedCharacters || [],
    waitingForPlayer: game.waitingForPlayer || false,
    showingRoundIntro: game.showingRoundIntro || false,
    currentPlayerIndex: game.currentPlayerIndex || 0,
    category: categoryInfo,
    usesCategory: usesCategory
  };
};

// Crear nueva partida
router.post('/create', auth, async (req, res) => {
  try {
    const { characters, timePerRound, numPlayers, gameMode, charactersPerPlayer, categoryId, maxCharacters } = req.body;

    // Validar número de jugadores
    if (!numPlayers || numPlayers < 2) {
      return res.status(400).json({ message: 'Debe haber al menos 2 jugadores' });
    }

    let gameCharacters = [];
    let playerCharacters = {};
    let useCategory = false;

    // Si se proporciona categoryId, usar personajes de la categoría
    if (categoryId) {
      const category = await Category.findByPk(categoryId, {
        include: [{
          model: Character,
          as: 'characters',
          attributes: ['name']
        }]
      });

      if (!category) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      if (!category.characters || category.characters.length < 10) {
        return res.status(400).json({ message: 'La categoría no tiene suficientes personajes (mínimo 10)' });
      }

      // Obtener todos los personajes de la categoría
      let allCharacters = category.characters.map(c => c.name);
      
      // Si se especifica un límite, validar y aplicar
      if (maxCharacters) {
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          return res.status(400).json({ message: 'El límite de personajes debe ser un número mayor a 0' });
        }
        if (maxChars > allCharacters.length) {
          return res.status(400).json({ 
            message: `El límite no puede exceder ${allCharacters.length} personajes (total de la categoría)` 
          });
        }
        // Mezclar y tomar solo el número especificado
        for (let i = allCharacters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allCharacters[i], allCharacters[j]] = [allCharacters[j], allCharacters[i]];
        }
        gameCharacters = allCharacters.slice(0, maxChars);
      } else {
        // Usar todos los personajes
        gameCharacters = allCharacters;
        // Mezclar aleatoriamente
        for (let i = gameCharacters.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [gameCharacters[i], gameCharacters[j]] = [gameCharacters[j], gameCharacters[i]];
        }
      }
      
      useCategory = true;
    } else {
      // Modo clásico: cada jugador aporta personajes
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

      gameCharacters = trimmedChars;
      playerCharacters = { [req.user.id]: trimmedChars };
    }

    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = Game.generateRoomCode();
      const existing = await Game.findOne({ where: { roomCode } });
      exists = !!existing;
    }

    const game = await Game.create({
      roomCode,
      hostId: req.user.id,
      players: [{
        user: req.user.id,
        team: 1,
        score: 0
      }],
      characters: gameCharacters,
      playerCharacters: playerCharacters,
      numPlayers: numPlayers,
      gameMode: gameMode || 'teams',
      charactersPerPlayer: useCategory ? 0 : (charactersPerPlayer || 2), // 0 significa que usa categoría
      categoryId: categoryId || null,
      timePerRound: timePerRound || 60,
      timer: {
        timeLeft: timePerRound || 60,
        isPaused: false
      }
    });

    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    console.error('Error creating game:', error);
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
    const usesCategory = game.categoryId != null || game.charactersPerPlayer === 0;
    
    // Verificar si el usuario ya está en la partida
    const alreadyInGame = players.some(p => p.user === req.user.id);
    
    if (alreadyInGame) {
      // Si usa categoría, no necesita aportar personajes
      if (usesCategory) {
        const formattedGame = await formatGame(game, req);
        return res.json({ game: formattedGame });
      }
      
      // Si ya está en la partida pero no ha aportado personajes, permitir agregarlos
      if (!playerCharacters[req.user.id] && characters) {
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

        // Agregar personajes del jugador
        playerCharacters[req.user.id] = trimmedChars;
        const allCharacters = game.characters || [];
        allCharacters.push(...trimmedChars);
        
        await game.update({ 
          characters: allCharacters,
          playerCharacters: playerCharacters
        });
      }
      
      const formattedGame = await formatGame(game, req);
      return res.json({ game: formattedGame });
    }

    // Si el jugador aporta personajes al unirse (solo si no usa categoría)
    if (!usesCategory && characters) {
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

    // Agregar personajes al pool si se proporcionaron (solo si no usa categoría)
    const allCharacters = game.characters || [];
    if (!usesCategory && characters) {
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
    const usesCategory = game.categoryId != null || game.charactersPerPlayer === 0;
    
    if (players.length < 2) {
      return res.status(400).json({ message: 'Se necesitan al menos 2 jugadores' });
    }

    // Si no usa categoría, verificar que todos los jugadores hayan aportado personajes
    if (!usesCategory) {
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
    } else {
      // Modo categoría: solo verificar que hay suficientes jugadores
      if (players.length < 2) {
        return res.status(400).json({ message: 'Se necesitan al menos 2 jugadores' });
      }
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
      currentPlayerIndex: 0,
      characters: shuffled,
      roundCharacters: shuffled, // Personajes disponibles en la ronda
      blockedCharacters: [],
      playerStats: {},
      waitingForPlayer: true, // Empezar con pantalla de espera
      showingRoundIntro: true, // Mostrar intro de ronda 1
      timer: {
        timeLeft: game.timePerRound,
        isPaused: true // Pausado hasta que el jugador esté listo
      }
    });

    await game.reload();
    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Acierto - remueve el personaje de la ronda
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

    // Incrementar puntuación del equipo
    player.score++;
    const roundScores = game.roundScores || {
      round1: { team1: 0, team2: 0 },
      round2: { team1: 0, team2: 0 },
      round3: { team1: 0, team2: 0 }
    };
    const roundKey = `round${game.currentRound}`;
    roundScores[roundKey][`team${game.currentTeam}`]++;

    // Actualizar estadísticas del jugador
    const playerStats = game.playerStats || {};
    if (!playerStats[req.user.id]) {
      playerStats[req.user.id] = { hits: 0, fails: 0 };
    }
    playerStats[req.user.id].hits++;

    // Remover el personaje actual de roundCharacters (ya fue adivinado)
    let roundCharacters = [...(game.roundCharacters || [])];
    const blockedCharacters = game.blockedCharacters || [];
    const availableChars = roundCharacters.filter(c => !blockedCharacters.includes(c));
    const currentIndex = game.currentCharacterIndex % availableChars.length;
    const guessedCharacter = availableChars[currentIndex];
    
    roundCharacters = roundCharacters.filter(c => c !== guessedCharacter);

    let newIndex = 0;
    let newRound = game.currentRound;
    let newTeam = game.currentTeam;
    let newStatus = game.status;
    let newRoundCharacters = roundCharacters;
    let newBlockedCharacters = blockedCharacters;
    let waitingForPlayer = false;
    let showingRoundIntro = false;
    const characters = game.characters || [];

    // Verificar si se terminaron los personajes de la ronda
    if (roundCharacters.length === 0) {
      // Pasar a siguiente ronda
      if (game.currentRound < 3) {
        newRound = game.currentRound + 1;
        newTeam = game.currentTeam === 1 ? 2 : 1; // Alternar quién empieza
        newIndex = 0;
        // Resetear todos los personajes para la nueva ronda
        const shuffled = [...characters];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        newRoundCharacters = shuffled;
        newBlockedCharacters = [];
        waitingForPlayer = true;
        showingRoundIntro = true;
      } else {
        // Juego terminado
        newStatus = 'finished';
      }
    }

    await game.update({
      players,
      roundScores,
      playerStats,
      currentCharacterIndex: newIndex,
      currentRound: newRound,
      currentTeam: newTeam,
      status: newStatus,
      roundCharacters: newRoundCharacters,
      blockedCharacters: newBlockedCharacters,
      waitingForPlayer,
      showingRoundIntro
    });

    await game.reload();
    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fallo - bloquea la tarjeta y termina el turno
router.post('/:roomCode/fail', auth, async (req, res) => {
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

    // Actualizar estadísticas del jugador (fallo)
    const playerStats = game.playerStats || {};
    if (!playerStats[req.user.id]) {
      playerStats[req.user.id] = { hits: 0, fails: 0 };
    }
    playerStats[req.user.id].fails++;

    // Bloquear el personaje actual para este turno
    const roundCharacters = game.roundCharacters || [];
    const blockedCharacters = [...(game.blockedCharacters || [])];
    const availableChars = roundCharacters.filter(c => !blockedCharacters.includes(c));
    const currentIndex = game.currentCharacterIndex % availableChars.length;
    const failedCharacter = availableChars[currentIndex];
    blockedCharacters.push(failedCharacter);

    // Terminar el turno - cambiar de equipo
    let newRound = game.currentRound;
    let newTeam = game.currentTeam;
    let newStatus = game.status;
    let newRoundCharacters = roundCharacters;
    let newBlockedCharacters = [];
    let waitingForPlayer = true;
    let showingRoundIntro = false;
    const characters = game.characters || [];

    if (game.currentTeam === 2) {
      // Equipo 2 falló, pasar a siguiente ronda
      if (game.currentRound < 3) {
        newRound = game.currentRound + 1;
        newTeam = 1;
        // Resetear personajes para nueva ronda
        const shuffled = [...characters];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        newRoundCharacters = shuffled;
        showingRoundIntro = true;
      } else {
        newStatus = 'finished';
        waitingForPlayer = false;
      }
    } else {
      // Equipo 1 falló, pasar a equipo 2 (mantener personajes no adivinados)
      newTeam = 2;
      // Barajear los personajes restantes de la ronda
      const remaining = [...roundCharacters];
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      newRoundCharacters = remaining;
    }

    await game.update({
      playerStats,
      currentCharacterIndex: 0,
      currentRound: newRound,
      currentTeam: newTeam,
      status: newStatus,
      roundCharacters: newRoundCharacters,
      blockedCharacters: newBlockedCharacters,
      waitingForPlayer,
      showingRoundIntro,
      timer: {
        timeLeft: game.timePerRound,
        isPaused: true
      }
    });

    await game.reload();
    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Jugador listo para empezar su turno
router.post('/:roomCode/ready', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game || game.status !== 'playing') {
      return res.status(400).json({ message: 'Partida no disponible' });
    }

    await game.update({
      waitingForPlayer: false,
      showingRoundIntro: false,
      blockedCharacters: [],
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

// Confirmar intro de ronda vista
router.post('/:roomCode/round-intro-seen', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    await game.update({
      showingRoundIntro: false
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
