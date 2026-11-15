const { Router } = require('express');
const { body } = require('express-validator');
const { getToday, open, close } = require('../controllers/cashRegisterController');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/cash-register/today
 */
router.get('/today', getToday);

/**
 * POST /api/cash-register/open
 */
router.post(
  '/open',
  [
    body('openingAmount')
      .optional()
      .isDecimal().withMessage('El monto de apertura debe ser un número decimal válido'),
    handleValidation,
  ],
  open
);

/**
 * POST /api/cash-register/close
 */
router.post('/close', close);

module.exports = router;
