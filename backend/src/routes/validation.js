const { validationResult } = require('express-validator');

/**
 * Middleware helper para manejar errores de express-validator.
 * Se usa en las rutas después de las validaciones.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = { handleValidation };
