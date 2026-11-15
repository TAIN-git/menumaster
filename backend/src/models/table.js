const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantTable = sequelize.define('RestaurantTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
  },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED'),
    defaultValue: 'AVAILABLE',
  },
}, {
  tableName: 'tables',
  timestamps: false,
  underscored: true,
});

module.exports = RestaurantTable;
