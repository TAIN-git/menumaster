const sequelize = require('../config/database');
const User = require('./user');
const Category = require('./category');
const Dish = require('./dish');
const RestaurantTable = require('./table');
const Order = require('./order');
const OrderItem = require('./orderItem');
const CashRegister = require('./cashRegister');

// Category <-> Dish
Category.hasMany(Dish, { foreignKey: 'categoryId', as: 'dishes' });
Dish.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// User <-> Order (waiter)
User.hasMany(Order, { foreignKey: 'waiterId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'waiterId', as: 'waiter' });

// RestaurantTable <-> Order
RestaurantTable.hasMany(Order, { foreignKey: 'tableId', as: 'orders' });
Order.belongsTo(RestaurantTable, { foreignKey: 'tableId', as: 'table' });

// CashRegister <-> Order
CashRegister.hasMany(Order, { foreignKey: 'cashRegisterId', as: 'orders' });
Order.belongsTo(CashRegister, { foreignKey: 'cashRegisterId', as: 'cashRegister' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// OrderItem <-> Dish
OrderItem.belongsTo(Dish, { foreignKey: 'dishId', as: 'dish' });
Dish.hasMany(OrderItem, { foreignKey: 'dishId', as: 'orderItems' });

// CashRegister <-> User (openedBy)
CashRegister.belongsTo(User, { foreignKey: 'openedBy', as: 'openedByUser' });

module.exports = {
  sequelize,
  User,
  Category,
  Dish,
  RestaurantTable,
  Order,
  OrderItem,
  CashRegister,
};
