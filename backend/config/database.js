const { Sequelize } = require('sequelize');

// Configuración de la base de datos
// Soporta tanto variables DB_* como TIDB_* (compatible con documentación oficial de TiDB)
const sequelize = new Sequelize(
  process.env.TIDB_DATABASE || process.env.DB_NAME || 'personajes',
  process.env.TIDB_USER || process.env.DB_USER || 'root',
  process.env.TIDB_PASSWORD || process.env.DB_PASSWORD || '',
  {
    host: process.env.TIDB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TIDB_PORT || process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Configuración SSL para TiDB Cloud
    // TiDB Cloud Starter/Essential REQUIERE SSL obligatoriamente
    // Según documentación oficial: https://docs.pingcap.com/tidbcloud
    // SSL debe estar habilitado con minVersion: 'TLSv1.2'
    dialectOptions: (process.env.DB_SSL === 'true' || process.env.TIDB_ENABLE_SSL === 'true') ? {
      ssl: {
        minVersion: 'TLSv1.2',
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
