const { Dish, Category } = require('../models');

/**
 * GET /api/dishes
 * Listar todos los platos con info de categoría (autenticado).
 * Soporta filtro por ?categoryId=
 */
const getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }

    const dishes = await Dish.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });

    return res.json({
      success: true,
      data: dishes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dishes/available
 * Listar platos disponibles agrupados por categoría (autenticado).
 */
const getAvailable = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { active: true },
      include: [{
        model: Dish,
        as: 'dishes',
        where: { available: true },
        required: false,
        order: [['displayOrder', 'ASC']],
      }],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']],
    });

    // Filtrar categorías que tienen al menos un plato disponible
    const result = categories
      .filter((cat) => cat.dishes && cat.dishes.length > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        dishes: cat.dishes,
      }));

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/dishes
 * Crear plato (solo ADMIN).
 */
const create = async (req, res, next) => {
  try {
    const { categoryId, name, description, price, imageUrl, available, displayOrder } = req.body;

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    const dish = await Dish.create({
      categoryId,
      name,
      description,
      price,
      imageUrl,
      available: available !== undefined ? available : true,
      displayOrder: displayOrder || 0,
    });

    const dishWithCategory = await Dish.findByPk(dish.id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });

    return res.status(201).json({
      success: true,
      data: dishWithCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/dishes/:id
 * Actualizar plato (solo ADMIN).
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, imageUrl, available, displayOrder } = req.body;

    const dish = await Dish.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Plato no encontrado',
      });
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada',
        });
      }
    }

    const updateData = {};
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (available !== undefined) updateData.available = available;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    await dish.update(updateData);

    const updatedDish = await Dish.findByPk(id, {
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    });

    return res.json({
      success: true,
      data: updatedDish,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/dishes/:id
 * Toggle available=false (solo ADMIN).
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Plato no encontrado',
      });
    }

    await dish.update({ available: false });

    return res.json({
      success: true,
      message: 'Plato marcado como no disponible',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getAvailable, create, update, remove };
