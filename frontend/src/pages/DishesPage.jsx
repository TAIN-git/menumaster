import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import dishService from '../services/dishService';
import categoryService from '../services/categoryService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);

const initialForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageUrl: '',
  displayOrder: 0,
};

const DishesPage = () => {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchDishes = useCallback(async () => {
    try {
      const response = await dishService.getAll(filterCategory || undefined);
      setDishes(response.data || response || []);
    } catch (err) {
      console.error('Error cargando platos:', err);
      showSnackbar('Error al cargar los platos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data || response || []);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    fetchDishes();
  }, [fetchDishes]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (dish = null) => {
    if (dish) {
      setEditingDish(dish);
      setForm({
        name: dish.name || '',
        description: dish.description || '',
        price: dish.price?.toString() || '',
        categoryId: dish.categoryId || dish.category?.id || dish.category?._id || '',
        imageUrl: dish.imageUrl || '',
        displayOrder: dish.displayOrder || 0,
      });
    } else {
      setEditingDish(null);
      setForm(initialForm);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDish(null);
    setForm(initialForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.price || parseFloat(form.price) <= 0) errors.price = 'Ingrese un precio válido';
    if (!form.categoryId) errors.categoryId = 'Seleccione una categoría';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const data = {
      ...form,
      price: parseFloat(form.price),
      displayOrder: parseInt(form.displayOrder) || 0,
    };

    try {
      if (editingDish) {
        await dishService.update(editingDish.id || editingDish._id, data);
        showSnackbar('Plato actualizado exitosamente');
      } else {
        await dishService.create(data);
        showSnackbar('Plato creado exitosamente');
      }
      handleCloseDialog();
      fetchDishes();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al guardar el plato';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (dish) => {
    try {
      await dishService.update(dish.id || dish._id, {
        isAvailable: !dish.isAvailable,
      });
      showSnackbar(
        dish.isAvailable ? 'Plato marcado como no disponible' : 'Plato marcado como disponible'
      );
      fetchDishes();
    } catch (err) {
      showSnackbar('Error al actualizar disponibilidad', 'error');
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await dishService.remove(deletingId);
      showSnackbar('Plato eliminado exitosamente');
      fetchDishes();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar el plato';
      showSnackbar(message, 'error');
    } finally {
      setConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const getCategoryName = (dish) => {
    if (dish.category?.name) return dish.category.name;
    const cat = categories.find(
      (c) => (c.id || c._id) === (dish.categoryId || dish.category?.id || dish.category?._id)
    );
    return cat?.name || '-';
  };

  if (loading && dishes.length === 0) return <LoadingSpinner message="Cargando platos..." />;

  return (
    <Box>
      <PageHeader
        title="Platos"
        subtitle="Administra los platos del menú"
        actionLabel="Nuevo Plato"
        actionIcon={<AddIcon />}
        onAction={() => handleOpenDialog()}
      />

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel>Filtrar por categoría</InputLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            label="Filtrar por categoría"
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {dishes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <RestaurantIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No hay platos registrados</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {dishes.map((dish) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dish.id || dish._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: dish.isAvailable !== false ? 1 : 0.7,
                }}
              >
                <Box
                  sx={{
                    height: 160,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {dish.imageUrl ? (
                    <Box
                      component="img"
                      src={dish.imageUrl}
                      alt={dish.name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          '<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%"><span style="font-size:48px;color:#ccc">🍽️</span></div>';
                      }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: 48 }}>🍽️</Typography>
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {dish.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 40 }}>
                    {dish.description || 'Sin descripción'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {formatCurrency(dish.price)}
                    </Typography>
                    <Chip label={getCategoryName(dish)} size="small" variant="outlined" />
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dish.isAvailable !== false}
                        onChange={() => handleToggleAvailability(dish)}
                        color="success"
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {dish.isAvailable !== false ? 'Disponible' : 'No disponible'}
                      </Typography>
                    }
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => handleOpenDialog(dish)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(dish.id || dish._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDish ? 'Editar Plato' : 'Nuevo Plato'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Precio"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              error={!!formErrors.price}
              helperText={formErrors.price}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <FormControl fullWidth required error={!!formErrors.categoryId}>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                label="Categoría"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.categoryId && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {formErrors.categoryId}
                </Typography>
              )}
            </FormControl>
            <TextField
              label="URL de imagen"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              fullWidth
              placeholder="https://..."
            />
            <TextField
              label="Orden de visualización"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : editingDish ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar Plato"
        message="¿Estás seguro de que deseas eliminar este plato?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setDeletingId(null);
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DishesPage;
