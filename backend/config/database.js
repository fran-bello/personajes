const { Sequelize } = require('sequelize');

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || 'personajes',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Configuración SSL para servicios como PlanetScale
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {}
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL conectado correctamente.');
    
    // Importar modelos para que se registren con Sequelize (incluye relaciones)
    require('../models/index');
    
    // Sincronizar modelos (crear tablas si no existen, sin alterar existentes)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('Modelos sincronizados.');
    }
  } catch (error) {
    console.error('Error conectando a MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
