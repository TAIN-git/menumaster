const { Router } = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const dishRoutes = require('./dishRoutes');
const tableRoutes = require('./tableRoutes');
const orderRoutes = require('./orderRoutes');
const kitchenRoutes = require('./kitchenRoutes');
const cashRegisterRoutes = require('./cashRegisterRoutes');
const statsRoutes = require('./statsRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/dishes', dishRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/kitchen', kitchenRoutes);
router.use('/cash-register', cashRegisterRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
