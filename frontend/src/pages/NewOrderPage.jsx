import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import tableService from '../services/tableService';
import dishService from '../services/dishService';
import categoryService from '../services/categoryService';
import orderService from '../services/orderService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

const NewOrderPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedTable, setSelectedTable] = useState(searchParams.get('tableId') || '');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [cart, setCart] = useState([]); // [{ dish, quantity, notes }]
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [tablesRes, catRes, dishRes] = await Promise.all([
          tableService.getAll(),
          categoryService.getAll(),
          dishService.getAvailable(),
        ]);
        setTables(tablesRes.data || []);
        setCategories(catRes.data || []);
        setDishes(dishRes.data || []);
      } catch (err) {
        setError('Error al cargar la información inicial');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filteredDishes =
    categories.length > 0 && categories[selectedCategory]
      ? dishes.filter((d) => d.categoryId === categories[selectedCategory].id)
      : dishes;

  const handleAddToCart = (dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (dishId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveFromCart = (dishId) => {
    setCart((prev) => prev.filter((item) => item.dish.id !== dishId));
  };

  const handleItemNotesChange = (dishId, notes) => {
    setCart((prev) =>
      prev.map((item) => (item.dish.id === dishId ? { ...item, notes } : item))
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.dish.price) * item.quantity, 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedTable) {
      setError('Debes seleccionar una mesa');
      return;
    }
    if (cart.length === 0) {
      setError('Debes agregar al menos un plato al pedido');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Crear la orden
      const orderRes = await orderService.create({
        tableId: selectedTable,
        notes: orderNotes,
      });

      const orderId = orderRes.data.id;

      // 2. Agregar los items
      const itemsPayload = cart.map((item) => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        notes: item.notes,
      }));

      await orderService.addItems(orderId, itemsPayload);

      // Redirigir a detalle del pedido
      navigate(`/orders/${orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el pedido. Verifica que la caja esté abierta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando menú y mesas..." />;

  return (
    <Box>
      <PageHeader
        title="Tomar Nuevo Pedido"
        subtitle="Selecciona la mesa y agrega los platos solicitados por el cliente"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Catálogo de platos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="table-select-label">Seleccionar Mesa</InputLabel>
              <Select
                labelId="table-select-label"
                value={selectedTable}
                label="Seleccionar Mesa"
                onChange={(e) => setSelectedTable(e.target.value)}
              >
                {tables.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    Mesa #{t.number} — Capacidad: {t.capacity} pers. ({t.status === 'AVAILABLE' ? 'Disponible' : 'Ocupada'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tabs
              value={selectedCategory}
              onChange={(e, val) => setSelectedCategory(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              {categories.map((cat) => (
                <Tab key={cat.id} label={cat.name} />
              ))}
            </Tabs>

            <Grid container spacing={2}>
              {filteredDishes.length === 0 ? (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No hay platos disponibles en esta categoría
                  </Typography>
                </Grid>
              ) : (
                filteredDishes.map((dish) => (
                  <Grid item xs={12} sm={6} key={dish.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                      }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {dish.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mb: 1 }}>
                          {dish.description}
                        </Typography>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {formatCurrency(dish.price)}
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 1.5, pt: 0, textAlign: 'right' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddToCart(dish)}
                        >
                          Agregar
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Resumen del pedido / Carrito */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: 80 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Badge badgeContent={cart.length} color="primary">
                <CartIcon />
              </Badge>
              <Typography variant="h6" fontWeight="bold">
                Resumen del Pedido
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {cart.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No has agregado ningún plato aún.
              </Typography>
            ) : (
              <List sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {cart.map((item) => (
                  <ListItem key={item.dish.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {item.dish.name}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(item.dish.price * item.quantity)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(item.dish.id, -1)}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(item.dish.id, 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFromCart(item.dish.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <TextField
                      placeholder="Nota (ej: sin sal, término medio)"
                      size="small"
                      variant="standard"
                      fullWidth
                      value={item.notes}
                      onChange={(e) => handleItemNotesChange(item.dish.id, e.target.value)}
                      sx={{ mt: 0.5 }}
                    />
                    <Divider sx={{ mt: 1 }} />
                  </ListItem>
                ))}
              </List>
            )}

            <Box sx={{ mt: 2 }}>
              <TextField
                label="Notas generales del pedido"
                multiline
                rows={2}
                fullWidth
                size="small"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {formatCurrency(calculateTotal())}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={<ReceiptIcon />}
                disabled={cart.length === 0 || !selectedTable || submitting}
                onClick={handleSubmitOrder}
              >
                {submitting ? 'Creando Pedido...' : 'Confirmar y Enviar a Cocina'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NewOrderPage;
