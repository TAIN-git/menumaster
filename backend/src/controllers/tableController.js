const { RestaurantTable, Order } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/tables
 * Listar todas las mesas (autenticado).
 */
const getAll = async (req, res, next) => {
  try {
    const tables = await RestaurantTable.findAll({
      order: [['number', 'ASC']],
    });

    return res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tables
 * Crear mesa (solo ADMIN).
 */
const create = async (req, res, next) => {
  try {
    const { number, capacity, status } = req.body;

    const table = await RestaurantTable.create({
      number,
      capacity: capacity || 4,
      status: status || 'AVAILABLE',
    });

    return res.status(201).json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tables/:id
 * Actualizar mesa (solo ADMIN).
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { number, capacity, status } = req.body;

    const table = await RestaurantTable.findByPk(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada',
      });
    }

    const updateData = {};
    if (number !== undefined) updateData.number = number;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (status !== undefined) updateData.status = status;

    await table.update(updateData);

    return res.json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tables/:id
 * Eliminar mesa (solo ADMIN, solo si no tiene órdenes activas).
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const table = await RestaurantTable.findByPk(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada',
      });
    }

    const activeOrders = await Order.count({
      where: {
        tableId: id,
        status: { [Op.notIn]: ['CLOSED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la mesa porque tiene órdenes activas',
      });
    }

    await table.destroy();

    return res.json({
      success: true,
      message: 'Mesa eliminada correctamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
