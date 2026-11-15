const { Op } = require('sequelize');
const { Order, OrderItem, Dish, RestaurantTable, User, CashRegister, sequelize } = require('../models');

/**
 * GET /api/orders
 * Listar órdenes con filtros (?status=, ?tableId=, ?waiterId=).
 * Incluye info de mesa y mesero.
 */
const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.tableId) where.tableId = req.query.tableId;
    if (req.query.waiterId) where.waiterId = req.query.waiterId;

    const orders = await Order.findAll({
      where,
      include: [
        { model: RestaurantTable, as: 'table', attributes: ['id', 'number', 'capacity', 'status'] },
        { model: User, as: 'waiter', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Obtener detalle de orden con items e info de platos.
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: RestaurantTable, as: 'table', attributes: ['id', 'number', 'capacity', 'status'] },
        { model: User, as: 'waiter', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Dish, as: 'dish', attributes: ['id', 'name', 'description', 'price', 'imageUrl'] }],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders
 * Crear orden. Body: { tableId, notes }.
 * Auto-asigna waiterId del usuario autenticado y busca la caja del día.
 */
const create = async (req, res, next) => {
  try {
    const { tableId, notes } = req.body;

    // Verificar que la caja del día esté abierta
    const today = new Date().toISOString().split('T')[0];
    const cashRegister = await CashRegister.findOne({
      where: { date: today, status: 'OPEN' },
    });

    if (!cashRegister) {
      return res.status(400).json({
        success: false,
        message: 'No se puede crear la orden: la caja del día no está abierta',
      });
    }

    // Verificar que la mesa existe
    const table = await RestaurantTable.findByPk(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada',
      });
    }

    const order = await Order.create({
      tableId,
      waiterId: req.user.id,
      cashRegisterId: cashRegister.id,
      notes,
      status: 'OPEN',
      total: 0,
    });

    // Marcar mesa como ocupada
    await table.update({ status: 'OCCUPIED' });

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: RestaurantTable, as: 'table', attributes: ['id', 'number', 'capacity', 'status'] },
        { model: User, as: 'waiter', attributes: ['id', 'name', 'email'] },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/items
 * Agregar items a la orden. Body: { items: [{ dishId, quantity, notes }] }.
 * Congela precios, calcula subtotales, recalcula total de la orden.
 */
const addItems = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { items } = req.body;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    if (['CLOSED', 'CANCELLED'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pueden agregar items a una orden cerrada o cancelada',
      });
    }

    const createdItems = [];

    for (const item of items) {
      const dish = await Dish.findByPk(item.dishId, { transaction });
      if (!dish) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Plato con id ${item.dishId} no encontrado`,
        });
      }

      if (!dish.available) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `El plato "${dish.name}" no está disponible`,
        });
      }

      const quantity = item.quantity || 1;
      const unitPrice = parseFloat(dish.price);
      const subtotal = parseFloat((unitPrice * quantity).toFixed(2));

      const orderItem = await OrderItem.create({
        orderId: order.id,
        dishId: dish.id,
        quantity,
        unitPrice,
        subtotal,
        notes: item.notes || null,
        status: 'PENDING',
      }, { transaction });

      createdItems.push(orderItem);
    }

    // Recalcular total de la orden
    const allItems = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction,
    });

    const newTotal = allItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    const updateData = { total: parseFloat(newTotal.toFixed(2)) };

    // Si la orden estaba OPEN, pasarla a IN_PROGRESS
    if (order.status === 'OPEN') {
      updateData.status = 'IN_PROGRESS';
    }

    await order.update(updateData, { transaction });

    await transaction.commit();

    // Recargar la orden completa
    const fullOrder = await Order.findByPk(id, {
      include: [
        { model: RestaurantTable, as: 'table', attributes: ['id', 'number', 'capacity', 'status'] },
        { model: User, as: 'waiter', attributes: ['id', 'name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Dish, as: 'dish', attributes: ['id', 'name', 'description', 'price', 'imageUrl'] }],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: fullOrder,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * PUT /api/orders/:id/items/:itemId
 * Actualizar item (quantity, notes, status).
 * Recalcular subtotal y total de la orden.
 */
const updateItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, itemId } = req.params;
    const { quantity, notes, status } = req.body;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    const item = await OrderItem.findOne({
      where: { id: itemId, orderId: id },
      transaction,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en esta orden',
      });
    }

    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    if (quantity !== undefined) {
      updateData.quantity = quantity;
      updateData.subtotal = parseFloat((parseFloat(item.unitPrice) * quantity).toFixed(2));
    }

    await item.update(updateData, { transaction });

    // Recalcular total de la orden
    const allItems = await OrderItem.findAll({
      where: { orderId: id },
      transaction,
    });

    const newTotal = allItems.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
    await order.update({ total: parseFloat(newTotal.toFixed(2)) }, { transaction });

    await transaction.commit();

    const updatedItem = await OrderItem.findByPk(itemId, {
      include: [{ model: Dish, as: 'dish', attributes: ['id', 'name', 'description', 'price', 'imageUrl'] }],
    });

    return res.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * DELETE /api/orders/:id/items/:itemId
 * Eliminar item de la orden. Recalcular total.
 */
const removeItem = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, itemId } = req.params;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    if (['CLOSED', 'CANCELLED'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pueden eliminar items de una orden cerrada o cancelada',
      });
    }

    const item = await OrderItem.findOne({
      where: { id: itemId, orderId: id },
      transaction,
    });

    if (!item) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en esta orden',
      });
    }

    await item.destroy({ transaction });

    // Recalcular total de la orden
    const remainingItems = await OrderItem.findAll({
      where: { orderId: id },
      transaction,
    });

    const newTotal = remainingItems.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
    await order.update({ total: parseFloat(newTotal.toFixed(2)) }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Item eliminado correctamente',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * POST /api/orders/:id/close
 * Cerrar orden. Verifica que todos los items estén DELIVERED.
 * Actualiza caja, verifica si la mesa tiene más órdenes abiertas.
 */
const closeOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    if (order.status === 'CLOSED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La orden ya está cerrada',
      });
    }

    if (order.status === 'CANCELLED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede cerrar una orden cancelada',
      });
    }

    // Verificar que todos los items estén DELIVERED
    const nonDeliveredItems = order.items.filter((item) => item.status !== 'DELIVERED');
    if (nonDeliveredItems.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede cerrar la orden: hay items que no han sido entregados',
      });
    }

    // Cerrar orden
    await order.update({
      status: 'CLOSED',
      closedAt: new Date(),
    }, { transaction });

    // Actualizar totalSales de la caja
    if (order.cashRegisterId) {
      const cashRegister = await CashRegister.findByPk(order.cashRegisterId, { transaction });
      if (cashRegister) {
        const newTotalSales = parseFloat(cashRegister.totalSales) + parseFloat(order.total);
        await cashRegister.update({
          totalSales: parseFloat(newTotalSales.toFixed(2)),
        }, { transaction });
      }
    }

    // Verificar si la mesa tiene otras órdenes abiertas
    const otherOpenOrders = await Order.count({
      where: {
        tableId: order.tableId,
        id: { [Op.ne]: order.id },
        status: { [Op.notIn]: ['CLOSED', 'CANCELLED'] },
      },
      transaction,
    });

    if (otherOpenOrders === 0) {
      await RestaurantTable.update(
        { status: 'AVAILABLE' },
        { where: { id: order.tableId }, transaction }
      );
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Orden cerrada correctamente',
      data: { orderId: order.id, total: order.total },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * POST /api/orders/:id/cancel
 * Cancelar orden. Verifica si la mesa tiene más órdenes abiertas.
 */
const cancelOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    if (['CLOSED', 'CANCELLED'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'La orden ya está cerrada o cancelada',
      });
    }

    await order.update({ status: 'CANCELLED' }, { transaction });

    // Verificar si la mesa tiene otras órdenes abiertas
    const otherOpenOrders = await Order.count({
      where: {
        tableId: order.tableId,
        id: { [Op.ne]: order.id },
        status: { [Op.notIn]: ['CLOSED', 'CANCELLED'] },
      },
      transaction,
    });

    if (otherOpenOrders === 0) {
      await RestaurantTable.update(
        { status: 'AVAILABLE' },
        { where: { id: order.tableId }, transaction }
      );
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Orden cancelada correctamente',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = { getAll, getById, create, addItems, updateItem, removeItem, closeOrder, cancelOrder };
