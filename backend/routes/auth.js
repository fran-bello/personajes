const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// Registro
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario existe
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario o email ya existe' });
    }

    // Crear usuario
    const user = await User.create({
      username,
      email,
      password,
      authProvider: 'local'
    });

    res.status(201).json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        characters: user.characters
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login/Registro con Google
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Datos de Google incompletos' });
    }

    // Buscar usuario existente por googleId o email
    let user = await User.findOne({
      where: {
        [Op.or]: [{ googleId }, { email }]
      }
    });

    if (user) {
      // Usuario existe - actualizar datos de Google si es necesario
      if (!user.googleId) {
        // Usuario existía con email pero sin Google - vincular cuenta
        await user.update({
          googleId,
          avatar: picture || user.avatar,
          authProvider: user.authProvider === 'local' ? 'local' : 'google'
        });
      } else {
        // Actualizar avatar si cambió
        if (picture && picture !== user.avatar) {
          await user.update({ avatar: picture });
        }
      }
    } else {
      // Crear nuevo usuario
      // Generar username único basado en el nombre
      let baseUsername = name ? name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15) : 'user';
      let username = baseUsername;
      let counter = 1;
      
      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email,
        googleId,
        avatar: picture,
        authProvider: 'google',
        password: null
      });
    }

    res.json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        characters: user.characters || [],
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    res.json({
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        characters: user.characters
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener usuario actual
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      characters: req.user.characters,
      gamesPlayed: req.user.gamesPlayed,
      gamesWon: req.user.gamesWon
    }
  });
});

module.exports = router;
