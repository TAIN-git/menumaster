const { Router } = require('express');
const { getDashboard, getTopDishes } = require('../controllers/statsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/stats/dashboard
 */
router.get('/dashboard', getDashboard);

/**
 * GET /api/stats/top-dishes
 */
router.get('/top-dishes', getTopDishes);

module.exports = router;
