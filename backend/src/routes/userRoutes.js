const { Router } = require('express');
const { body } = require('express-validator');
const { getAll, create, update, remove } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/users
 */
router.get('/', getAll);

/**
 * POST /api/users
 */
router.post(
  '/',
  [
    body('name')
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    body('email')
      .notEmpty().withMessage('El email es obligatorio')
      .isEmail().withMessage('Email inválido'),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'WAITER', 'KITCHEN']).withMessage('Rol inválido. Valores permitidos: ADMIN, WAITER, KITCHEN'),
    handleValidation,
  ],
  create
);

/**
 * PUT /api/users/:id
 */
router.put(
  '/:id',
  [
    body('name')
      .optional()
      .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
    body('email')
      .optional()
      .isEmail().withMessage('Email inválido'),
    body('password')
      .optional()
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'WAITER', 'KITCHEN']).withMessage('Rol inválido'),
    handleValidation,
  ],
  update
);

/**
 * DELETE /api/users/:id
 */
router.delete('/:id', remove);

module.exports = router;
