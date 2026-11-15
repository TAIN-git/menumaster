const { Router } = require('express');
const { body } = require('express-validator');
const { getAll, getAvailable, create, update, remove } = require('../controllers/dishController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/dishes
 */
router.get('/', getAll);

/**
 * GET /api/dishes/available
 */
router.get('/available', getAvailable);

/**
 * POST /api/dishes (solo ADMIN)
 */
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('categoryId')
      .notEmpty().withMessage('La categoría es obligatoria')
      .isInt().withMessage('categoryId debe ser un número entero'),
    body('name')
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ max: 150 }).withMessage('El nombre no puede exceder 150 caracteres'),
    body('description')
      .optional(),
    body('price')
      .notEmpty().withMessage('El precio es obligatorio')
      .isDecimal().withMessage('El precio debe ser un número decimal válido'),
    body('imageUrl')
      .optional()
      .isURL().withMessage('La URL de imagen debe ser válida'),
    body('displayOrder')
      .optional()
      .isInt().withMessage('El orden debe ser un número entero'),
    handleValidation,
  ],
  create
);

/**
 * PUT /api/dishes/:id (solo ADMIN)
 */
router.put(
  '/:id',
  authorize('ADMIN'),
  [
    body('categoryId')
      .optional()
      .isInt().withMessage('categoryId debe ser un número entero'),
    body('name')
      .optional()
      .isLength({ max: 150 }).withMessage('El nombre no puede exceder 150 caracteres'),
    body('price')
      .optional()
      .isDecimal().withMessage('El precio debe ser un número decimal válido'),
    body('imageUrl')
      .optional()
      .isURL().withMessage('La URL de imagen debe ser válida'),
    body('displayOrder')
      .optional()
      .isInt().withMessage('El orden debe ser un número entero'),
    handleValidation,
  ],
  update
);

/**
 * DELETE /api/dishes/:id (solo ADMIN)
 */
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
