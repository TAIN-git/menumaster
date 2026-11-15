const { Router } = require('express');
const { body } = require('express-validator');
const { getAll, create, update, remove } = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/tables
 */
router.get('/', getAll);

/**
 * POST /api/tables (solo ADMIN)
 */
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('number')
      .notEmpty().withMessage('El número de mesa es obligatorio')
      .isInt({ min: 1 }).withMessage('El número de mesa debe ser un entero positivo'),
    body('capacity')
      .optional()
      .isInt({ min: 1 }).withMessage('La capacidad debe ser un entero positivo'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'OCCUPIED', 'RESERVED']).withMessage('Estado inválido'),
    handleValidation,
  ],
  create
);

/**
 * PUT /api/tables/:id (solo ADMIN)
 */
router.put(
  '/:id',
  authorize('ADMIN'),
  [
    body('number')
      .optional()
      .isInt({ min: 1 }).withMessage('El número de mesa debe ser un entero positivo'),
    body('capacity')
      .optional()
      .isInt({ min: 1 }).withMessage('La capacidad debe ser un entero positivo'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'OCCUPIED', 'RESERVED']).withMessage('Estado inválido'),
    handleValidation,
  ],
  update
);

/**
 * DELETE /api/tables/:id (solo ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
