const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashRegister = sequelize.define('CashRegister', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
  openingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'opening_amount',
  },
  totalSales: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_sales',
  },
  closingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'closing_amount',
  },
  status: {
    type: DataTypes.ENUM('OPEN', 'CLOSED'),
    defaultValue: 'OPEN',
  },
  openedBy: {
    type: DataTypes.INTEGER,
    field: 'opened_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  openedAt: {
    type: DataTypes.DATE,
    field: 'opened_at',
  },
  closedAt: {
    type: DataTypes.DATE,
    field: 'closed_at',
  },
}, {
  tableName: 'cash_registers',
  timestamps: false,
  underscored: true,
});

module.exports = CashRegister;
