const express = require('express');
const { Op } = require('sequelize');
const Game = require('../models/Game');
const User = require('../models/User');
const { Category, Character } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper para calcular el siguiente turno alternando entre equipos y jugadores
// El orden es: Jugador 1 Equipo 1, Jugador 1 Equipo 2, Jugador 2 Equipo 1, Jugador 2 Equipo 2, etc.
const getNextTurn = (players, currentPlayerIndex) => {
  // Organizar jugadores por equipo
  const playersByTeam = {};
  players.forEach((player, index) => {
    const team = player.team;
    if (!playersByTeam[team]) {
      playersByTeam[team] = [];
    }
    playersByTeam[team].push({ ...player, originalIndex: index });
  });

  // Obtener todos los equipos y ordenarlos
  const teams = Object.keys(playersByTeam).map(Number).sort((a, b) => a - b);
  const maxPlayersPerTeam = Math.max(...teams.map(team => playersByTeam[team].length));
  const totalTeams = teams.length;

  // Calcular el siguiente índice global
  const nextGlobalIndex = currentPlayerIndex + 1;
  
  // Calcular qué posición de jugador dentro del equipo (0, 1, 2, ...)
  const playerPosition = Math.floor(nextGlobalIndex / totalTeams);
  
  // Calcular qué equipo debe jugar (alternando)
  const teamIndex = nextGlobalIndex % totalTeams;
  const nextTeam = teams[teamIndex];
  
  // Obtener el jugador específico de ese equipo en esa posición
  const teamPlayers = playersByTeam[nextTeam] || [];
  const playerIndexInTeam = playerPosition % teamPlayers.length;
  
  // Si hemos completado una ronda completa de todos los jugadores de todos los equipos, reiniciar
  // Esto ocurre cuando playerPosition >= maxPlayersPerTeam y volvemos al primer equipo
  if (playerPosition >= maxPlayersPerTeam && teamIndex === 0) {
    // Reiniciar al primer jugador del primer equipo
    return {
      team: teams[0],
      playerIndexInTeam: 0,
      globalIndex: 0
    };
  }

  return {
    team: nextTeam,
    playerIndexInTeam: playerIndexInTeam,
    globalIndex: nextGlobalIndex
  };
};

// Helper para obtener el equipo y jugador actual basándose en el índice global
const getCurrentTurn = (players, currentPlayerIndex) => {
  // Organizar jugadores por equipo
  const playersByTeam = {};
  players.forEach((player, index) => {
    const team = player.team;
    if (!playersByTeam[team]) {
      playersByTeam[team] = [];
    }
    playersByTeam[team].push({ ...player, originalIndex: index });
  });

  // Obtener todos los equipos y ordenarlos
  const teams = Object.keys(playersByTeam).map(Number).sort((a, b) => a - b);
  const totalTeams = teams.length;

  // Calcular qué posición de jugador dentro del equipo (0, 1, 2, ...)
  const playerPosition = Math.floor(currentPlayerIndex / totalTeams);
  
  // Calcular qué equipo debe jugar (alternando)
  const teamIndex = currentPlayerIndex % totalTeams;
  const currentTeam = teams[teamIndex];
  
  // Obtener el jugador específico de ese equipo en esa posición
  const teamPlayers = playersByTeam[currentTeam] || [];
  const playerIndexInTeam = playerPosition % teamPlayers.length;

  return {
    team: currentTeam,
    playerIndexInTeam: playerIndexInTeam
  };
};

// Helper para actualizar estadísticas cuando termina una partida
const updatePlayerStats = async (game) => {
  try {
    const players = game.players || [];
    const roundScores = game.roundScores || {
      round1: { team1: 0, team2: 0 },
      round2: { team1: 0, team2: 0 },
      round3: { team1: 0, team2: 0 }
    };

    // Calcular puntuación total por equipo
    const team1Score = roundScores.round1.team1 + roundScores.round2.team1 + roundScores.round3.team1;
    const team2Score = roundScores.round1.team2 + roundScores.round2.team2 + roundScores.round3.team2;

    // Determinar equipo ganador (si hay empate, nadie gana)
    const winningTeam = team1Score > team2Score ? 1 : (team2Score > team1Score ? 2 : null);

    // Actualizar estadísticas para todos los jugadores
    for (const player of players) {
      const userId = player.user;
      const user = await User.findByPk(userId);
      
      if (user) {
        // Incrementar partidas jugadas
        await user.update({
          gamesPlayed: (user.gamesPlayed || 0) + 1
        });

        // Si el jugador está en el equipo ganador, incrementar partidas ganadas
        if (winningTeam !== null && player.team === winningTeam) {
          await user.update({
            gamesWon: (user.gamesWon || 0) + 1
          });
        }
      }
    }
  } catch (error) {
    console.error('Error actualizando estadísticas de jugadores:', error);
    // No lanzar error para no interrumpir el flujo del juego
  }
};

// Helper para formatear game con usuarios
const formatGame = async (game, req = null) => {
  const players = game.players || [];
  
  // Recopilar todos los IDs de usuarios únicos que necesitamos (host + players)
  const userIds = new Set();
  if (game.hostId) userIds.add(game.hostId);
  players.forEach(player => {
    if (player.user) userIds.add(player.user);
  });
  
  // Hacer UNA sola consulta para obtener todos los usuarios necesarios
  const users = await User.findAll({
    where: { id: Array.from(userIds) },
    attributes: ['id', 'username', 'avatar']
  });
  
  // Crear un mapa para acceso rápido
  const usersMap = new Map();
  users.forEach(user => {
    usersMap.set(user.id, user);
  });
  
  // Obtener host (ya incluido en la consulta única)
  const host = usersMap.get(game.hostId);
  
  // Obtener información de usuarios para los players (usar el mapa en lugar de consultas)
  const playersWithUsers = players.map((player) => {
    const user = usersMap.get(player.user);
    return {
      user: user ? { _id: user.id, id: user.id, username: user.username, avatar: user.avatar } : { _id: player.user, id: player.user, username: 'Usuario', avatar: null },
      team: player.team,
      score: player.score
    };
  });

  // Solo devolver los personajes del usuario actual
  const playerCharacters = game.playerCharacters || {};
  const filteredPlayerCharacters = {};
  
  // Si hay un usuario en la request, solo mostrar sus personajes
  if (req && req.user) {
    filteredPlayerCharacters[req.user.id] = playerCharacters[req.user.id] || [];
  }

  // Obtener información de las categorías si existen
  let categoryInfo = null;
  let categoriesInfo = null;
  
  // Manejar categoryIds (múltiples categorías)
  if (game.categoryIds && Array.isArray(game.categoryIds) && game.categoryIds.length > 0) {
    const categories = await Category.findAll({
      where: { id: game.categoryIds },
      attributes: ['id', 'name', 'icon']
    });
    if (categories.length > 0) {
      if (categories.length === 1) {
        // Si solo hay una categoría, establecer categoryInfo
        categoryInfo = {
          id: categories[0].id,
          name: categories[0].name,
          icon: categories[0].icon
        };
        categoriesInfo = [categoryInfo];
      } else {
        // Si hay múltiples categorías, crear un categoryInfo "Variados"
        categoriesInfo = categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon
        }));
        categoryInfo = {
          id: null,
          name: 'Variados',
          icon: '🎲'
        };
      }
    }
  } 
  // Si categoryIds es null pero se usó categoría (useAllCategories), mostrar "Variados"
  else if (game.charactersPerPlayer === 0 && !game.categoryId && !game.categoryIds) {
    // Esto significa que se usaron todas las categorías
    categoryInfo = {
      id: null,
      name: 'Variados',
      icon: '🎲'
    };
    categoriesInfo = null; // No hay categorías específicas
  }
  // Legacy: manejar categoryId (una sola categoría)
  else if (game.categoryId) {
    const category = await Category.findByPk(game.categoryId, {
      attributes: ['id', 'name', 'icon']
    });
    if (category) {
      categoryInfo = {
        id: category.id,
        name: category.name,
        icon: category.icon
      };
      categoriesInfo = [categoryInfo];
    }
  }

  const usesCategory = (game.categoryId != null || (game.categoryIds && game.categoryIds.length > 0)) || game.charactersPerPlayer === 0;

  // Crear mapeo de personajes a categorías para mostrar en la UI
  let characterCategories = {};
  if (usesCategory) {
    // Obtener todas las categorías relevantes con sus personajes
    let categoriesToCheck = [];
    
    if (game.categoryIds && Array.isArray(game.categoryIds) && game.categoryIds.length > 0) {
      // Obtener las categorías específicas seleccionadas
      categoriesToCheck = await Category.findAll({
        where: { id: game.categoryIds },
        include: [{
          model: Character,
          as: 'characters',
          attributes: ['name']
        }]
      });
    } else if (game.categoryId) {
      // Legacy: una sola categoría
      const category = await Category.findByPk(game.categoryId, {
        include: [{
          model: Character,
          as: 'characters',
          attributes: ['name']
        }]
      });
      if (category) {
        categoriesToCheck = [category];
      }
    } else if (game.charactersPerPlayer === 0 && !game.categoryId && !game.categoryIds) {
      // Variados: todas las categorías activas
      categoriesToCheck = await Category.findAll({
        where: { isActive: true },
        include: [{
          model: Character,
          as: 'characters',
          attributes: ['name']
        }]
      });
    }
    
    // Crear mapeo de personaje -> categoría
    for (const category of categoriesToCheck) {
      if (category.characters && category.characters.length > 0) {
        for (const character of category.characters) {
          characterCategories[character.name] = {
            name: category.name,
            icon: category.icon
          };
        }
      }
    }
  }

  // Obtener avatar del host (ya está en el objeto host)
  const hostAvatar = host ? host.avatar : null;

  // Asegurar que playerAvatars siempre sea un objeto
  const gameData = game.toJSON();
  const playerAvatarsData = (gameData.playerAvatars && typeof gameData.playerAvatars === 'object') 
    ? gameData.playerAvatars 
    : {};

  return {
    ...gameData,
    host: host ? { _id: host.id, username: host.username, avatar: hostAvatar } : null,
    players: playersWithUsers,
    playerCharacters: filteredPlayerCharacters, // Solo los personajes del usuario actual
    playerAvatars: playerAvatarsData, // Avatares de todos los jugadores
    playerStats: gameData.playerStats || {},
    roundCharacters: gameData.roundCharacters || [],
    blockedCharacters: gameData.blockedCharacters || [],
    waitingForPlayer: gameData.waitingForPlayer || false,
    showingRoundIntro: gameData.showingRoundIntro || false,
    showingRoundIntroMidTurn: gameData.showingRoundIntroMidTurn || false,
    currentPlayerIndex: gameData.currentPlayerIndex || 0,
    category: categoryInfo, // Legacy: para compatibilidad
    categories: categoriesInfo, // Array de categorías seleccionadas
    usesCategory: usesCategory,
    characterCategories: characterCategories // Mapeo de personaje -> categoría
  };
};

// Crear nueva partida
router.post('/create', auth, async (req, res) => {
  try {
    const { characters, timePerRound, numPlayers, gameMode, charactersPerPlayer, categoryId, categoryIds, maxCharacters, avatar, useAllCategories } = req.body;

    // Validar número de jugadores
    if (!numPlayers || numPlayers < 2) {
      return res.status(400).json({ message: 'Debe haber al menos 2 jugadores' });
    }

    let gameCharacters = [];
    let playerCharacters = {};
    let playerAvatars = {};
    let useCategory = false;

    // Guardar avatar del host si se proporciona
    if (avatar) {
      playerAvatars[req.user.id] = avatar;
    }

    // Si se proporciona useAllCategories=true, usar personajes de TODAS las categorías activas
    // Si se proporciona categoryIds (array) o categoryId (legacy), usar personajes de las categorías seleccionadas
    const categoryIdsToUse = useAllCategories 
      ? null // No usar IDs específicos cuando se quiere todas las categorías
      : (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0 
          ? categoryIds 
          : (categoryId ? [categoryId] : null));
    
    if (useAllCategories || (categoryIdsToUse && categoryIdsToUse.length > 0)) {
      let allCharacters = [];
      
      if (useAllCategories) {
        // Obtener personajes de TODAS las categorías activas
        const allCategories = await Category.findAll({
          where: { isActive: true },
          include: [{
            model: Character,
            as: 'characters',
            attributes: ['name']
          }]
        });
        
        // Combinar todos los personajes de todas las categorías activas
        for (const category of allCategories) {
          if (category.characters && category.characters.length > 0) {
            const categoryChars = category.characters.map(c => c.name);
            allCharacters = allCharacters.concat(categoryChars);
          }
        }
      } else {
        // Validar que todas las categorías existan
        const categories = await Category.findAll({
          where: { id: categoryIdsToUse },
          include: [{
            model: Character,
            as: 'characters',
            attributes: ['name']
          }]
        });

        if (categories.length !== categoryIdsToUse.length) {
          return res.status(404).json({ message: 'Una o más categorías no fueron encontradas' });
        }

        // Validar que todas las categorías tengan suficientes personajes
        for (const category of categories) {
          if (!category.characters || category.characters.length < 10) {
            return res.status(400).json({ 
              message: `La categoría "${category.name}" no tiene suficientes personajes (mínimo 10)` 
            });
          }
        }

        // Combinar todos los personajes de todas las categorías seleccionadas
        for (const category of categories) {
          const categoryChars = category.characters.map(c => c.name);
          allCharacters = allCharacters.concat(categoryChars);
        }
      }
      
      // Eliminar duplicados (por si hay personajes repetidos entre categorías)
      allCharacters = [...new Set(allCharacters)];
      
      // Calcular cuántos personajes se necesitan
      const charsPerPlayer = charactersPerPlayer || 2;
      const calculatedMax = numPlayers * charsPerPlayer; // Cálculo automático: jugadores × personajes por jugador
      
      // Determinar el límite a usar
      let limitToUse;
      if (maxCharacters) {
        // Si se especifica un límite manual, validar y usar ese
        const maxChars = parseInt(maxCharacters);
        if (isNaN(maxChars) || maxChars < 1) {
          return res.status(400).json({ message: 'El límite de personajes debe ser un número mayor a 0' });
        }
        if (maxChars > allCharacters.length) {
          return res.status(400).json({ 
            message: `El límite no puede exceder ${allCharacters.length} personajes (total combinado de las categorías seleccionadas)` 
          });
        }
        limitToUse = maxChars;
      } else {
        // Si no se especifica límite manual, usar el cálculo automático
        limitToUse = calculatedMax;
        
        // Validar que el cálculo automático no exceda el total disponible
        if (limitToUse > allCharacters.length) {
          return res.status(400).json({ 
            message: `Se necesitan ${limitToUse} personajes (${numPlayers} jugadores × ${charsPerPlayer} por jugador), pero las categorías seleccionadas solo tienen ${allCharacters.length} personajes disponibles en total` 
          });
        }
      }
      
      // Mezclar aleatoriamente y tomar solo el número necesario
      for (let i = allCharacters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCharacters[i], allCharacters[j]] = [allCharacters[j], allCharacters[i]];
      }
      gameCharacters = allCharacters.slice(0, limitToUse);
      
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
      playerAvatars: playerAvatars,
      numPlayers: numPlayers,
      gameMode: gameMode || 'teams',
      charactersPerPlayer: useCategory ? 0 : (charactersPerPlayer || 2), // 0 significa que usa categoría
      categoryId: useAllCategories ? null : (categoryIdsToUse && categoryIdsToUse.length === 1 ? categoryIdsToUse[0] : null), // Legacy: solo si es una categoría
      categoryIds: useAllCategories ? null : (categoryIdsToUse && categoryIdsToUse.length > 0 ? categoryIdsToUse : null),
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
    const { roomCode, characters, avatar } = req.body;

    const game = await Game.findOne({ where: { roomCode } });
    
    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    if (game.status === 'finished') {
      return res.status(400).json({ message: 'Esta partida ya terminó' });
    }

    const players = game.players || [];
    const playerCharacters = game.playerCharacters || {};
    const playerAvatars = game.playerAvatars || {};
    const usesCategory = game.categoryId != null || game.charactersPerPlayer === 0;
    
    // Verificar si el usuario ya está en la partida
    const alreadyInGame = players.some(p => p.user === req.user.id);
    
    if (alreadyInGame) {
      // Guardar avatar si se proporciona (actualizar avatar existente)
      if (avatar) {
        playerAvatars[req.user.id] = avatar;
        await game.update({ playerAvatars });
        
        // Emitir evento para notificar actualización de avatar
        const io = req.app.get('io');
        if (io) {
          io.to(roomCode).emit('game-updated');
        }
      }
      
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
        
        // Emitir evento para notificar actualización de personajes
        const io = req.app.get('io');
        if (io) {
          io.to(roomCode).emit('game-updated');
        }
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

    // Guardar avatar si se proporciona
    if (avatar) {
      playerAvatars[req.user.id] = avatar;
    }

    await game.update({ 
      players,
      characters: allCharacters,
      playerCharacters: playerCharacters,
      playerAvatars: playerAvatars
    });

    // Emitir evento para notificar a todos los jugadores (incluido el anfitrión)
    const io = req.app.get('io');
    if (io) {
      io.to(roomCode).emit('game-updated');
    }

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

    // Verificar que es el turno del jugador correcto usando la función helper
    const currentTurn = getCurrentTurn(players, game.currentPlayerIndex || 0);
    const currentTeamPlayers = players.filter(p => p.team === currentTurn.team);
    const expectedPlayer = currentTeamPlayers[currentTurn.playerIndexInTeam];
    
    // Rechazar si: no está en el equipo correcto, no hay expectedPlayer, o el expectedPlayer no es el usuario actual
    if (player.team !== currentTurn.team || 
        !expectedPlayer || 
        expectedPlayer.user !== req.user.id) {
      return res.status(400).json({ message: 'No es tu turno' });
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
    let showingRoundIntroMidTurn = false;
    const characters = game.characters || [];
    const timer = game.timer || { timeLeft: game.timePerRound, isPaused: false };
    
    // Si el frontend envía el tiempo actual, usarlo (más preciso que el de la BD)
    const currentTimeLeft = req.body.timeLeft !== undefined ? req.body.timeLeft : timer.timeLeft;
    
    let newTimer = { ...timer, timeLeft: currentTimeLeft };

    // Verificar si se terminaron los personajes de la ronda
    if (roundCharacters.length === 0) {
      // Pasar a siguiente ronda
      if (game.currentRound < 3) {
        newRound = game.currentRound + 1;
        // Si el juego está en progreso (no pausado), es un cambio de ronda en medio del turno
        // Preservar el tiempo restante y mostrar intro mid-turn
        if (!timer.isPaused && currentTimeLeft > 0) {
          showingRoundIntroMidTurn = true;
          // Preservar el tiempo actual del timer (usar el tiempo enviado por el frontend si está disponible)
          newTimer = {
            timeLeft: currentTimeLeft, // Preservar el tiempo restante (del frontend si está disponible)
            isPaused: true // Pausar hasta que el jugador continúe
          };
          // Mantener el mismo equipo y jugador (no alternar)
          newTeam = game.currentTeam;
        } else {
          // Si estaba pausado o sin tiempo, es un cambio normal de ronda
          // Usar la función helper para calcular el siguiente turno
          const nextTurn = getNextTurn(players, game.currentPlayerIndex || 0);
          newTeam = nextTurn.team;
          newTimer = {
            timeLeft: game.timePerRound,
            isPaused: true // Pausado hasta que el jugador esté listo
          };
          showingRoundIntro = true;
          // Actualizar el índice global del jugador
          game.currentPlayerIndex = nextTurn.globalIndex;
        }
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
      } else {
        // Juego terminado
        newStatus = 'finished';
      }
    } else {
      // No se terminaron los personajes: solo actualizar los personajes disponibles
      // El jugador continúa jugando hasta que falle o se le acabe el tiempo
      // NO cambiar el turno, mantener el mismo equipo y jugador
      newTeam = game.currentTeam;
      // No actualizar currentPlayerIndex, mantener el mismo jugador
      waitingForPlayer = false; // El jugador sigue jugando
      newBlockedCharacters = blockedCharacters; // Mantener personajes bloqueados del turno actual
      // Actualizar el índice del personaje para el siguiente personaje disponible
      const availableChars = newRoundCharacters.filter(c => !newBlockedCharacters.includes(c));
      newIndex = (game.currentCharacterIndex + 1) % availableChars.length;
    }

    await game.update({
      players,
      roundScores,
      playerStats,
      currentCharacterIndex: newIndex,
      currentRound: newRound,
      currentTeam: newTeam,
      currentPlayerIndex: game.currentPlayerIndex || 0,
      status: newStatus,
      roundCharacters: newRoundCharacters,
      blockedCharacters: newBlockedCharacters,
      waitingForPlayer,
      showingRoundIntro,
      showingRoundIntroMidTurn,
      timer: newTimer
    });

    await game.reload();

    // Si el juego terminó, actualizar estadísticas de los jugadores
    if (newStatus === 'finished' && game.status === 'finished') {
      await updatePlayerStats(game);
    }

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

    // Verificar que es el turno del jugador correcto usando la función helper
    const currentTurn = getCurrentTurn(players, game.currentPlayerIndex || 0);
    const currentTeamPlayers = players.filter(p => p.team === currentTurn.team);
    const expectedPlayer = currentTeamPlayers[currentTurn.playerIndexInTeam];
    
    // Rechazar si: no está en el equipo correcto, no hay expectedPlayer, o el expectedPlayer no es el usuario actual
    if (player.team !== currentTurn.team || 
        !expectedPlayer || 
        expectedPlayer.user !== req.user.id) {
      return res.status(400).json({ message: 'No es tu turno' });
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

    // Terminar el turno - cambiar al siguiente jugador alternando entre equipos
    let newRound = game.currentRound;
    let newTeam = game.currentTeam;
    let newStatus = game.status;
    let newRoundCharacters = roundCharacters;
    let newBlockedCharacters = [];
    let waitingForPlayer = true;
    let showingRoundIntro = false;
    const characters = game.characters || [];

    // Calcular el siguiente turno usando la función helper
    const nextTurn = getNextTurn(players, game.currentPlayerIndex || 0);
    newTeam = nextTurn.team;
    const newPlayerIndex = nextTurn.globalIndex;

    // El cambio de ronda solo ocurre cuando se terminan todos los personajes (en /hit)
    // Aquí solo cambiamos de turno, sin importar si se completa un ciclo completo
    // Si se completa un ciclo completo pero todavía hay personajes, simplemente continuar con el siguiente ciclo
    
    // Barajear los personajes restantes de la ronda
    const remaining = [...roundCharacters];
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    newRoundCharacters = remaining;

    await game.update({
      playerStats,
      currentCharacterIndex: 0,
      currentRound: newRound,
      currentTeam: newTeam,
      currentPlayerIndex: newPlayerIndex,
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

    // Si el juego terminó, actualizar estadísticas de los jugadores
    if (newStatus === 'finished' && game.status === 'finished') {
      await updatePlayerStats(game);
    }

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

    const timer = game.timer || { timeLeft: game.timePerRound, isPaused: false };
    
    // Si es intro mid-turn, preservar el tiempo y reanudar
    if (game.showingRoundIntroMidTurn) {
      await game.update({
        showingRoundIntroMidTurn: false,
        waitingForPlayer: false,
        timer: {
          timeLeft: timer.timeLeft, // Preservar tiempo restante
          isPaused: false // Reanudar el juego
        }
      });
    } else {
      // Intro normal de ronda
      await game.update({
        waitingForPlayer: false,
        showingRoundIntro: false,
        blockedCharacters: [],
        timer: {
          timeLeft: game.timePerRound,
          isPaused: false
        }
      });
    }

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

    const timer = game.timer || { timeLeft: game.timePerRound || 60, isPaused: false };
    // Preservar el tiempo actual si no se envía uno nuevo
    if (timeLeft !== undefined) {
      timer.timeLeft = timeLeft;
    } else {
      // Si no se envía timeLeft, mantener el tiempo actual del juego
      timer.timeLeft = timer.timeLeft || game.timePerRound || 60;
    }
    if (isPaused !== undefined) timer.isPaused = isPaused;

    await game.update({ timer });
    await game.reload();

    const formattedGame = await formatGame(game, req);
    res.json({ game: formattedGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancelar partida (solo anfitrión)
router.delete('/:roomCode', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    if (!game) {
      return res.status(404).json({ message: 'Partida no encontrada' });
    }

    const hostId = typeof game.hostId === 'object' ? (game.hostId.id || game.hostId._id) : game.hostId;
    if (hostId !== req.user.id) {
      return res.status(403).json({ message: 'Solo el anfitrión puede cancelar la partida' });
    }

    if (game.status === 'finished') {
      return res.status(400).json({ message: 'Esta partida ya terminó' });
    }

    const roomCode = req.params.roomCode;
    
    // Emitir evento ANTES de destruir para notificar a los demás jugadores
    const io = req.app.get('io');
    if (io) {
      // Emitir evento específico de cancelación para que el frontend redirija inmediatamente
      io.to(roomCode).emit('game-cancelled', { roomCode, message: 'La partida ha sido cancelada por el anfitrión' });
      // También emitir game-updated por compatibilidad
      io.to(roomCode).emit('game-updated');
    }
    
    await game.destroy();
    
    res.json({ message: 'Partida cancelada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Salirse de partida
router.post('/:roomCode/leave', auth, async (req, res) => {
  try {
    const game = await Game.findOne({ where: { roomCode: req.params.roomCode } });

    // Si el juego no existe (fue cancelado por el anfitrión), simplemente retornar éxito
    // para que los demás jugadores puedan salir sin problemas
    if (!game) {
      return res.json({ message: 'Partida no encontrada o ya cancelada' });
    }

    const hostId = typeof game.hostId === 'object' ? (game.hostId.id || game.hostId._id) : game.hostId;
    // Si es el anfitrión, permitir salirse pero sugerir cancelar
    // No bloquear la salida para evitar que quede atrapado
    if (hostId === req.user.id && game.status === 'waiting') {
      // Si es anfitrión y está en waiting, sugerir cancelar pero no bloquear
      // El frontend puede manejar esto mostrando un mensaje apropiado
    }

    // Permitir salirse incluso si el juego terminó
    // No bloquear la salida en ningún caso

    const players = game.players || [];
    const playerIndex = players.findIndex(p => p.user === req.user.id);

    if (playerIndex === -1) {
      return res.status(400).json({ message: 'No estás en esta partida' });
    }

    // Remover jugador
    players.splice(playerIndex, 1);

    // Remover personajes del jugador si existen
    const playerCharacters = game.playerCharacters || {};
    const playerAvatars = game.playerAvatars || {};
    const allCharacters = game.characters || [];

    if (playerCharacters[req.user.id]) {
      // Remover personajes del pool
      const userCharacters = playerCharacters[req.user.id];
      userCharacters.forEach(char => {
        const charIndex = allCharacters.indexOf(char);
        if (charIndex > -1) {
          allCharacters.splice(charIndex, 1);
        }
      });
      delete playerCharacters[req.user.id];
    }

    // Remover avatar del jugador
    if (playerAvatars[req.user.id]) {
      delete playerAvatars[req.user.id];
    }

    // Remover estadísticas del jugador
    const playerStats = game.playerStats || {};
    if (playerStats[req.user.id]) {
      delete playerStats[req.user.id];
    }

    await game.update({
      players,
      characters: allCharacters,
      playerCharacters,
      playerAvatars,
      playerStats
    });

    // Emitir evento para notificar a los demás jugadores
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.roomCode).emit('game-updated');
    }

    res.json({ message: 'Te has salido de la partida exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
