const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tableId: {
    type: DataTypes.INTEGER,
    field: 'table_id',
    references: {
      model: 'tables',
      key: 'id',
    },
  },
  waiterId: {
    type: DataTypes.INTEGER,
    field: 'waiter_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  cashRegisterId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cash_register_id',
    references: {
      model: 'cash_registers',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CLOSED', 'CANCELLED'),
    defaultValue: 'OPEN',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  closedAt: {
    type: DataTypes.DATE,
    field: 'closed_at',
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Order;
