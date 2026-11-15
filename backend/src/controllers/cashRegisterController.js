const { Op } = require('sequelize');
const { CashRegister, Order, User } = require('../models');

/**
 * GET /api/cash-register/today
 * Obtener el estado de la caja del día (solo ADMIN).
 */
const getToday = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const cashRegister = await CashRegister.findOne({
      where: { date: today },
      include: [
        { model: User, as: 'openedByUser', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!cashRegister) {
      return res.json({
        success: true,
        data: null,
        message: 'No hay caja abierta para hoy',
      });
    }

    return res.json({
      success: true,
      data: cashRegister,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cash-register/open
 * Abrir la caja del día. Body: { openingAmount }.
 * Falla si ya hay una caja abierta para hoy.
 */
const open = async (req, res, next) => {
  try {
    const { openingAmount } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const existing = await CashRegister.findOne({
      where: { date: today },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una caja para el día de hoy',
      });
    }

    const cashRegister = await CashRegister.create({
      date: today,
      openingAmount: openingAmount || 0,
      totalSales: 0,
      status: 'OPEN',
      openedBy: req.user.id,
      openedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: cashRegister,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cash-register/close
 * Cerrar la caja del día.
 * Falla si hay órdenes abiertas.
 * Calcula closingAmount = openingAmount + totalSales.
 */
const close = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const cashRegister = await CashRegister.findOne({
      where: { date: today, status: 'OPEN' },
    });

    if (!cashRegister) {
      return res.status(400).json({
        success: false,
        message: 'No hay caja abierta para cerrar hoy',
      });
    }

    // Verificar que no haya órdenes abiertas
    const openOrders = await Order.count({
      where: {
        cashRegisterId: cashRegister.id,
        status: { [Op.notIn]: ['CLOSED', 'CANCELLED'] },
      },
    });

    if (openOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede cerrar la caja: hay ${openOrders} orden(es) abierta(s)`,
      });
    }

    const closingAmount = parseFloat(cashRegister.openingAmount) + parseFloat(cashRegister.totalSales);

    await cashRegister.update({
      status: 'CLOSED',
      closingAmount: parseFloat(closingAmount.toFixed(2)),
      closedAt: new Date(),
    });

    return res.json({
      success: true,
      message: 'Caja cerrada correctamente',
      data: cashRegister,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getToday, open, close };
