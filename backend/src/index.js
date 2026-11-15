require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { sequelize, User } = require('./models');
const { runSeed } = require('./seeders/seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS permisivo para desarrollo y deploy en Vercel
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (como mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Parse JSON body
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MenuMaster API está activa y funcionando.',
    timestamp: new Date().toISOString(),
  });
});

// Montar rutas
app.use('/api', routes);

// Manejo global de errores
app.use(errorHandler);

// Sincronizar base de datos e iniciar servidor
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos.');

    // Verificar si la base de datos está vacía para auto-poblar datos iniciales
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('🌱 Base de datos vacía detectada. Ejecutando seed automático de datos iniciales...');
      await runSeed(false);
      console.log('✅ Base de datos inicializada con éxito.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 MenuMaster API corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error.message);
    process.exit(1);
  }
};

start();

module.exports = app;
