const { Router } = require('express');
const { body } = require('express-validator');
const {
  getAll, getById, create, addItems, updateItem, removeItem, closeOrder, cancelOrder,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/orders
 */
router.get('/', getAll);

/**
 * GET /api/orders/:id
 */
router.get('/:id', getById);

/**
 * POST /api/orders (ADMIN, WAITER)
 */
router.post(
  '/',
  authorize('ADMIN', 'WAITER'),
  [
    body('tableId')
      .notEmpty().withMessage('La mesa es obligatoria')
      .isInt().withMessage('tableId debe ser un número entero'),
    body('notes')
      .optional(),
    handleValidation,
  ],
  create
);

/**
 * POST /api/orders/:id/items (ADMIN, WAITER)
 */
router.post(
  '/:id/items',
  authorize('ADMIN', 'WAITER'),
  [
    body('items')
      .isArray({ min: 1 }).withMessage('Debe enviar al menos un item'),
    body('items.*.dishId')
      .notEmpty().withMessage('dishId es obligatorio para cada item')
      .isInt().withMessage('dishId debe ser un número entero'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
    body('items.*.notes')
      .optional(),
    handleValidation,
  ],
  addItems
);

/**
 * PUT /api/orders/:id/items/:itemId (autenticado)
 */
router.put(
  '/:id/items/:itemId',
  [
    body('quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('La cantidad debe ser un entero positivo'),
    body('notes')
      .optional(),
    body('status')
      .optional()
      .isIn(['PENDING', 'PREPARING', 'READY', 'DELIVERED']).withMessage('Estado de item inválido'),
    handleValidation,
  ],
  updateItem
);

/**
 * DELETE /api/orders/:id/items/:itemId (ADMIN, WAITER)
 */
router.delete(
  '/:id/items/:itemId',
  authorize('ADMIN', 'WAITER'),
  removeItem
);

/**
 * POST /api/orders/:id/close (ADMIN, WAITER)
 */
router.post('/:id/close', authorize('ADMIN', 'WAITER'), closeOrder);

/**
 * POST /api/orders/:id/cancel (ADMIN, WAITER)
 */
router.post('/:id/cancel', authorize('ADMIN', 'WAITER'), cancelOrder);

module.exports = router;
