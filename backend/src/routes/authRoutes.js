const { Router } = require('express');
const { body } = require('express-validator');
const { login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidation } = require('./validation');

const router = Router();

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email')
      .notEmpty().withMessage('El email es obligatorio')
      .isEmail().withMessage('Email inválido'),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria'),
    handleValidation,
  ],
  login
);

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, me);

module.exports = router;
