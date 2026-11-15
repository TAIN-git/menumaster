const { Router } = require('express');
const { getQueue, markReady } = require('../controllers/kitchenController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN o KITCHEN
router.use(authenticate, authorize('ADMIN', 'KITCHEN'));

/**
 * GET /api/kitchen/queue
 */
router.get('/queue', getQueue);

/**
 * PUT /api/kitchen/items/:itemId/ready
 */
router.put('/items/:itemId/ready', markReady);

module.exports = router;
