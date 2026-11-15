const { Op, fn, col, literal } = require('sequelize');
const { Order, OrderItem, Dish, RestaurantTable, CashRegister, sequelize } = require('../models');

/**
 * GET /api/stats/dashboard
 * Resumen del día: total órdenes, total ventas, órdenes por estado, mesas ocupadas.
 */
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today + 'T00:00:00.000Z');
    const endOfDay = new Date(today + 'T23:59:59.999Z');

    // Total de órdenes del día
    const totalOrders = await Order.count({
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
    });

    // Total de ventas (de órdenes cerradas)
    const salesResult = await Order.sum('total', {
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: 'CLOSED',
      },
    });
    const totalSales = salesResult || 0;

    // Órdenes por estado
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
      group: ['status'],
      raw: true,
    });

    // Mesas ocupadas
    const occupiedTables = await RestaurantTable.count({
      where: { status: 'OCCUPIED' },
    });

    const totalTables = await RestaurantTable.count();

    // Caja del día
    const cashRegister = await CashRegister.findOne({
      where: { date: today },
    });

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalSales: parseFloat(totalSales),
        ordersByStatus,
        tables: {
          occupied: occupiedTables,
          total: totalTables,
        },
        cashRegister: cashRegister
          ? {
            status: cashRegister.status,
            openingAmount: parseFloat(cashRegister.openingAmount),
            totalSales: parseFloat(cashRegister.totalSales),
          }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stats/top-dishes
 * Top 10 platos más pedidos con cantidad total vendida.
 * Query: ?days=7 para rango de fechas.
 */
const getTopDishes = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const topDishes = await OrderItem.findAll({
      attributes: [
        'dishId',
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('subtotal')), 'totalRevenue'],
      ],
      include: [
        {
          model: Dish,
          as: 'dish',
          attributes: ['id', 'name', 'price', 'imageUrl'],
        },
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            created_at: { [Op.gte]: since },
            status: { [Op.ne]: 'CANCELLED' },
          },
        },
      ],
      group: ['dishId', 'dish.id'],
      order: [[literal('"totalQuantity"'), 'DESC']],
      limit: 10,
      raw: false,
    });

    return res.json({
      success: true,
      data: topDishes,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getTopDishes };
