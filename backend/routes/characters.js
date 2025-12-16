const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Obtener personajes del usuario
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ characters: user.characters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Agregar personaje
router.post('/', auth, async (req, res) => {
  try {
    const { character } = req.body;

    if (!character || character.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del personaje es requerido' });
    }

    const user = await User.findByPk(req.user.id);
    const characters = user.characters || [];
    
    if (characters.includes(character.trim())) {
      return res.status(400).json({ message: 'Este personaje ya existe' });
    }

    characters.push(character.trim());
    await user.update({ characters });

    res.json({ characters: user.characters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar personaje
router.delete('/:character', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const characters = (user.characters || []).filter(c => c !== req.params.character);
    await user.update({ characters });

    res.json({ characters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar lista de personajes
router.put('/', auth, async (req, res) => {
  try {
    const { characters } = req.body;

    if (!Array.isArray(characters)) {
      return res.status(400).json({ message: 'Los personajes deben ser un array' });
    }

    const user = await User.findByPk(req.user.id);
    const cleanedCharacters = characters.map(c => c.trim()).filter(c => c.length > 0);
    await user.update({ characters: cleanedCharacters });

    res.json({ characters: cleanedCharacters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
