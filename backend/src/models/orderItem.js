const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  dishId: {
    type: DataTypes.INTEGER,
    field: 'dish_id',
    references: {
      model: 'dishes',
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  notes: {
    type: DataTypes.STRING(255),
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PREPARING', 'READY', 'DELIVERED'),
    defaultValue: 'PENDING',
  },
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});

module.exports = OrderItem;
