const { Router } = require('express');
const { body } = require('express-validator');
const { getAll, create, update, remove } = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/categories
 */
router.get('/', getAll);

/**
 * POST /api/categories (solo ADMIN)
 */
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name')
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres'),
    body('displayOrder')
      .optional()
      .isInt().withMessage('El orden debe ser un número entero'),
    handleValidation,
  ],
  create
);

/**
 * PUT /api/categories/:id (solo ADMIN)
 */
router.put(
  '/:id',
  authorize('ADMIN'),
  [
    body('name')
      .optional()
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres'),
    body('displayOrder')
      .optional()
      .isInt().withMessage('El orden debe ser un número entero'),
    handleValidation,
  ],
  update
);

/**
 * DELETE /api/categories/:id (solo ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
