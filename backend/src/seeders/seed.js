require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Dish, RestaurantTable } = require('../models');

const seed = async () => {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Reiniciar todas las tablas
    await sequelize.sync({ force: true });
    console.log('✅ Tablas recreadas.');

    // ========================
    // Crear usuario administrador
    // ========================
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin123!', salt);

    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@menumaster.com',
      passwordHash,
      role: 'ADMIN',
    });
    console.log(`✅ Usuario admin creado: ${admin.email}`);

    // ========================
    // Crear categorías
    // ========================
    const categoriesData = [
      { name: 'Entradas', description: 'Platos para comenzar', displayOrder: 1 },
      { name: 'Platos Principales', description: 'Platos fuertes del menú', displayOrder: 2 },
      { name: 'Pastas', description: 'Pastas artesanales y salsas caseras', displayOrder: 3 },
      { name: 'Carnes', description: 'Cortes selectos a la parrilla', displayOrder: 4 },
      { name: 'Postres', description: 'Dulces tentaciones para cerrar', displayOrder: 5 },
      { name: 'Bebidas', description: 'Bebidas frías y calientes', displayOrder: 6 },
    ];

    const categories = await Category.bulkCreate(categoriesData);
    console.log(`✅ ${categories.length} categorías creadas.`);

    // Mapear categorías por nombre para referencia fácil
    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.name] = cat.id;
    });

    // ========================
    // Crear platos
    // ========================
    const dishesData = [
      // Entradas
      {
        categoryId: catMap['Entradas'],
        name: 'Empanadas de Carne (x3)',
        description: 'Empanadas caseras de carne cortada a cuchillo',
        price: 4500.00,
        displayOrder: 1,
      },
      {
        categoryId: catMap['Entradas'],
        name: 'Provoleta a la Parrilla',
        description: 'Provolone fundido con orégano y tomate',
        price: 5200.00,
        displayOrder: 2,
      },
      {
        categoryId: catMap['Entradas'],
        name: 'Bruschetta Mixta',
        description: 'Pan tostado con tomate, albahaca y jamón crudo',
        price: 4800.00,
        displayOrder: 3,
      },

      // Platos Principales
      {
        categoryId: catMap['Platos Principales'],
        name: 'Milanesa Napolitana con Papas Fritas',
        description: 'Milanesa de ternera con salsa de tomate, jamón y mozzarella',
        price: 9800.00,
        displayOrder: 1,
      },
      {
        categoryId: catMap['Platos Principales'],
        name: 'Suprema Maryland',
        description: 'Suprema de pollo con banana frita, choclo y papas',
        price: 9200.00,
        displayOrder: 2,
      },
      {
        categoryId: catMap['Platos Principales'],
        name: 'Merluza a la Romana con Ensalada',
        description: 'Filete de merluza rebozado con ensalada mixta',
        price: 8500.00,
        displayOrder: 3,
      },

      // Pastas
      {
        categoryId: catMap['Pastas'],
        name: 'Ravioles de Ricotta y Nuez',
        description: 'Ravioles caseros con salsa filetto',
        price: 7800.00,
        displayOrder: 1,
      },
      {
        categoryId: catMap['Pastas'],
        name: 'Ñoquis de Papa',
        description: 'Ñoquis caseros con salsa bolognesa o pesto',
        price: 7200.00,
        displayOrder: 2,
      },
      {
        categoryId: catMap['Pastas'],
        name: 'Fetuccini Alfredo',
        description: 'Fetuccini con salsa crema, parmesano y champiñones',
        price: 8200.00,
        displayOrder: 3,
      },

      // Carnes
      {
        categoryId: catMap['Carnes'],
        name: 'Bife de Chorizo (400g)',
        description: 'Corte jugoso a la parrilla con guarnición a elección',
        price: 14500.00,
        displayOrder: 1,
      },
      {
        categoryId: catMap['Carnes'],
        name: 'Ojo de Bife (350g)',
        description: 'Corte premium con papas rústicas',
        price: 15800.00,
        displayOrder: 2,
      },
      {
        categoryId: catMap['Carnes'],
        name: 'Entraña a la Parrilla',
        description: 'Entraña con chimichurri casero y verduras grilladas',
        price: 13200.00,
        displayOrder: 3,
      },

      // Postres
      {
        categoryId: catMap['Postres'],
        name: 'Flan Casero con Dulce de Leche',
        description: 'Flan de vainilla con dulce de leche y crema',
        price: 4200.00,
        displayOrder: 1,
      },
      {
        categoryId: catMap['Postres'],
        name: 'Tiramisú',
        description: 'Clásico tiramisú italiano con café y mascarpone',
        price: 5500.00,
        displayOrder: 2,
      },
      {
        categoryId: catMap['Postres'],
        name: 'Panqueques con Dulce de Leche',
        description: 'Panqueques rellenos con dulce de leche y bañados en chocolate',
        price: 4800.00,
        displayOrder: 3,
      },

      // Bebidas
      {
        categoryId: catMap['Bebidas'],
        name: 'Agua Mineral (500ml)',
        description: 'Con o sin gas',
        price: 1800.00,
        displayOrder: 1,
      },
      {
        categoryId: catMap['Bebidas'],
        name: 'Gaseosa (500ml)',
        description: 'Coca-Cola, Sprite o Fanta',
        price: 2200.00,
        displayOrder: 2,
      },
      {
        categoryId: catMap['Bebidas'],
        name: 'Cerveza Artesanal (pinta)',
        description: 'Variedad del día: Rubia, Roja o IPA',
        price: 3800.00,
        displayOrder: 3,
      },
    ];

    const dishes = await Dish.bulkCreate(dishesData);
    console.log(`✅ ${dishes.length} platos creados.`);

    // ========================
    // Crear mesas
    // ========================
    const tablesData = [
      { number: 1, capacity: 2 },
      { number: 2, capacity: 2 },
      { number: 3, capacity: 4 },
      { number: 4, capacity: 4 },
      { number: 5, capacity: 4 },
      { number: 6, capacity: 6 },
      { number: 7, capacity: 6 },
      { number: 8, capacity: 6 },
    ];

    const tables = await RestaurantTable.bulkCreate(tablesData);
    console.log(`✅ ${tables.length} mesas creadas.`);

    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('📧 Login: admin@menumaster.com');
    console.log('🔑 Password: Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seed();
