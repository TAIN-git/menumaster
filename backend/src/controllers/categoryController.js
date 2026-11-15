const { Category } = require('../models');

/**
 * GET /api/categories
 * Listar categorías activas (autenticado).
 */
const getAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { active: true },
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 * Crear categoría (solo ADMIN).
 */
const create = async (req, res, next) => {
  try {
    const { name, description, displayOrder } = req.body;

    const category = await Category.create({
      name,
      description,
      displayOrder: displayOrder || 0,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 * Actualizar categoría (solo ADMIN).
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, displayOrder, active } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (active !== undefined) updateData.active = active;

    await category.update(updateData);

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 * Soft-delete: desactivar categoría (solo ADMIN).
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    await category.update({ active: false });

    return res.json({
      success: true,
      message: 'Categoría desactivada correctamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove };
