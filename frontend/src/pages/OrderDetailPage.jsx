import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import orderService from '../services/orderService';
import dishService from '../services/dishService';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const formatCurrency = (val) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

const statusConfig = {
  OPEN: { label: 'Abierto', color: 'info' },
  IN_PROGRESS: { label: 'En Progreso', color: 'warning' },
  READY: { label: 'Listo para Servir', color: 'success' },
  DELIVERED: { label: 'Entregado', color: 'primary' },
  CLOSED: { label: 'Cerrado / Cobrado', color: 'default' },
  CANCELLED: { label: 'Cancelado', color: 'error' },
};

const itemStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'default' },
  PREPARING: { label: 'En Cocina', color: 'warning' },
  READY: { label: 'Listo', color: 'success' },
  DELIVERED: { label: 'Entregado', color: 'info' },
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal para agregar platos adicionales
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);
  const [selectedDishId, setSelectedDishId] = useState('');
  const [dishQuantity, setDishQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getById(id);
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleOpenAddItem = async () => {
    try {
      const res = await dishService.getAvailable();
      setAvailableDishes(res.data || []);
      setAddItemOpen(true);
    } catch (err) {
      setError('Error al obtener lista de platos');
    }
  };

  const handleConfirmAddItem = async () => {
    if (!selectedDishId) return;
    try {
      await orderService.addItems(id, [
        { dishId: selectedDishId, quantity: dishQuantity, notes: itemNotes },
      ]);
      setFeedback('Plato agregado a la orden');
      setAddItemOpen(false);
      setSelectedDishId('');
      setDishQuantity(1);
      setItemNotes('');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar plato');
    }
  };

  const handleDeliverItem = async (itemId) => {
    try {
      await orderService.updateItem(id, itemId, { status: 'DELIVERED' });
      setFeedback('Item marcado como entregado');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar item');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await orderService.removeItem(id, itemId);
      setFeedback('Item eliminado de la orden');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar item');
    }
  };

  const handleCloseOrder = async () => {
    try {
      await orderService.close(id);
      setFeedback('Orden cerrada y cobrada con éxito');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar orden');
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar esta orden?')) return;
    try {
      await orderService.cancel(id);
      setFeedback('Orden cancelada');
      fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar orden');
    }
  };

  if (loading) return <LoadingSpinner message="Cargando detalle del pedido..." />;
  if (!order) return <Alert severity="error">No se encontró la orden solicitada.</Alert>;

  const config = statusConfig[order.status] || statusConfig.OPEN;
  const isOrderActive = ['OPEN', 'IN_PROGRESS', 'READY'].includes(order.status);
  const items = order.items || [];
  const allDelivered = items.length > 0 && items.every((i) => i.status === 'DELIVERED');

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Pedido #{order.id} — Mesa #{order.table?.number || order.tableId}
        </Typography>
        <Chip label={config.label} color={config.color} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Información general */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Detalles del Pedido
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Mesa
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    #{order.table?.number} (Cap. {order.table?.capacity})
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Mozo
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {order.waiter?.name || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Hora Creación
                  </Typography>
                  <Typography variant="body1">
                    {order.created_at ? format(new Date(order.created_at), 'HH:mm dd/MM', { locale: es }) : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Hora Cierre
                  </Typography>
                  <Typography variant="body1">
                    {order.closed_at ? format(new Date(order.closed_at), 'HH:mm dd/MM', { locale: es }) : 'En curso'}
                  </Typography>
                </Grid>
              </Grid>

              {order.notes && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Observaciones:</strong> {order.notes}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tabla de Items */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Platos Solicitados
              </Typography>
              {isOrderActive && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddItem}
                >
                  Agregar Plato
                </Button>
              )}
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Plato</TableCell>
                    <TableCell align="center">Cant.</TableCell>
                    <TableCell align="right">P. Unitario</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    {isOrderActive && <TableCell align="center">Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const itemConf = itemStatusConfig[item.status] || itemStatusConfig.PENDING;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.dish?.name || 'Plato'}
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary">
                              Nota: {item.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice || item.unit_price)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                        <TableCell align="center">
                          <Chip label={itemConf.label} color={itemConf.color} size="small" />
                        </TableCell>
                        {isOrderActive && (
                          <TableCell align="center">
                            {item.status === 'READY' && (
                              <Button
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={() => handleDeliverItem(item.id)}
                              >
                                Entregar
                              </Button>
                            )}
                            {item.status === 'PENDING' && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Panel lateral de cobro y acciones */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Resumen de Cobro
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Subtotal:</Typography>
              <Typography variant="body1">{formatCurrency(order.total)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold">Total:</Typography>
              <Typography variant="h5" color="primary.main" fontWeight="bold">
                {formatCurrency(order.total)}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {isOrderActive ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  fullWidth
                  disabled={!allDelivered}
                  onClick={handleCloseOrder}
                >
                  Cerrar y Cobrar Pedido
                </Button>
                {!allDelivered && (
                  <Typography variant="caption" color="text.secondary" align="center">
                    * Todos los platos deben estar entregados para poder cobrar.
                  </Typography>
                )}

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleCancelOrder}
                >
                  Cancelar Pedido
                </Button>
              </Box>
            ) : (
              <Alert severity={order.status === 'CLOSED' ? 'success' : 'error'}>
                Este pedido está {config.label.toLowerCase()}.
              </Alert>
            )}

            <Button
              variant="text"
              startIcon={<PrintIcon />}
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => window.print()}
            >
              Imprimir Ticket
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal agregar plato */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Plato a la Orden</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="dish-select-label">Plato</InputLabel>
              <Select
                labelId="dish-select-label"
                value={selectedDishId}
                label="Plato"
                onChange={(e) => setSelectedDishId(e.target.value)}
              >
                {availableDishes.map((dish) => (
                  <MenuItem key={dish.id} value={dish.id}>
                    {dish.name} — {formatCurrency(dish.price)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Cantidad"
              type="number"
              inputProps={{ min: 1 }}
              value={dishQuantity}
              onChange={(e) => setDishQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              fullWidth
            />

            <TextField
              label="Observaciones (opcional)"
              placeholder="Ej: sin picante, bien cocido"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!selectedDishId}
            onClick={handleConfirmAddItem}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        message={feedback}
      />
    </Box>
  );
};

export default OrderDetailPage;
