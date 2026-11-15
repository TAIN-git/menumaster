const { Op } = require('sequelize');
const { OrderItem, Order, Dish, RestaurantTable } = require('../models');

/**
 * GET /api/kitchen/queue
 * Obtener todos los items con status PENDING o PREPARING,
 * ordenados por createdAt ASC. Incluye info de orden (mesa) y plato.
 */
const getQueue = async (req, res, next) => {
  try {
    const items = await OrderItem.findAll({
      where: {
        status: { [Op.in]: ['PENDING', 'PREPARING'] },
      },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'tableId', 'status', 'created_at'],
          include: [
            { model: RestaurantTable, as: 'table', attributes: ['id', 'number'] },
          ],
        },
        {
          model: Dish,
          as: 'dish',
          attributes: ['id', 'name', 'description', 'imageUrl'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/kitchen/items/:itemId/ready
 * Marcar item como READY.
 * Si todos los items de la orden son READY o DELIVERED, marcar orden como READY.
 */
const markReady = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await OrderItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado',
      });
    }

    await item.update({ status: 'READY' });

    // Verificar si todos los items de la orden están READY o DELIVERED
    const orderItems = await OrderItem.findAll({
      where: { orderId: item.orderId },
    });

    const allReadyOrDelivered = orderItems.every(
      (oi) => oi.status === 'READY' || oi.status === 'DELIVERED'
    );

    if (allReadyOrDelivered) {
      await Order.update(
        { status: 'READY' },
        { where: { id: item.orderId } }
      );
    }

    return res.json({
      success: true,
      message: 'Item marcado como listo',
      data: {
        itemId: item.id,
        orderId: item.orderId,
        orderReady: allReadyOrDelivered,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQueue, markReady };
