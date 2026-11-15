import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import orderService from '../services/orderService';
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
  CLOSED: { label: 'Cerrado', color: 'default' },
  CANCELLED: { label: 'Cancelado', color: 'error' },
};

const itemStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'default' },
  PREPARING: { label: 'En Preparación', color: 'warning' },
  READY: { label: '¡Listo!', color: 'success' },
  DELIVERED: { label: 'Entregado', color: 'info' },
};

const MyOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Traer órdenes del mozo (o todas si es admin)
      const params = user?.role === 'ADMIN' ? {} : { waiterId: user?.id };
      const res = await orderService.getAll(params);
      
      // Filtrar solo las órdenes activas prioritariamente
      const sorted = (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
    } catch (err) {
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleDeliverItem = async (orderId, itemId) => {
    try {
      await orderService.updateItem(orderId, itemId, { status: 'DELIVERED' });
      setFeedback('Item marcado como entregado');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar item');
    }
  };

  const handleCloseOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      title: 'Cerrar Pedido',
      message: '¿Confirmas el cobro y cierre de este pedido? La mesa quedará disponible si no hay más pedidos.',
      action: async () => {
        try {
          await orderService.close(orderId);
          setFeedback('Pedido cerrado y cobrado correctamente');
          fetchOrders();
        } catch (err) {
          setError(err.response?.data?.message || 'Error al cerrar pedido');
        }
      },
    });
  };

  const handleCancelOrder = (orderId) => {
    setConfirmDialog({
      open: true,
      title: 'Cancelar Pedido',
      message: '¿Estás seguro de cancelar este pedido? Esta acción no se puede deshacer.',
      action: async () => {
        try {
          await orderService.cancel(orderId);
          setFeedback('Pedido cancelado');
          fetchOrders();
        } catch (err) {
          setError(err.response?.data?.message || 'Error al cancelar pedido');
        }
      },
    });
  };

  if (loading && orders.length === 0) return <LoadingSpinner message="Cargando tus pedidos..." />;

  const activeOrders = orders.filter((o) => ['OPEN', 'IN_PROGRESS', 'READY'].includes(o.status));
  const pastOrders = orders.filter((o) => ['CLOSED', 'CANCELLED'].includes(o.status));

  return (
    <Box>
      <PageHeader
        title="Mis Pedidos"
        subtitle="Control y seguimiento de los pedidos en curso"
        actionLabel="Actualizar"
        actionIcon={<RefreshIcon />}
        onAction={fetchOrders}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Pedidos Activos ({activeOrders.length})
      </Typography>

      {activeOrders.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No tienes pedidos activos en este momento.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {activeOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.OPEN;
            const items = order.items || [];
            const allDelivered = items.length > 0 && items.every((i) => i.status === 'DELIVERED');

            return (
              <Grid item xs={12} md={6} key={order.id}>
                <Card variant="outlined" sx={{ boxShadow: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Pedido #{order.id} — Mesa #{order.table?.number || order.tableId}
                      </Typography>
                      <Chip label={config.label} color={config.color} size="small" />
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      Creado: {order.created_at ? format(new Date(order.created_at), 'HH:mm - dd/MM', { locale: es }) : '-'}
                      {order.waiter?.name && ` | Mozo: ${order.waiter.name}`}
                    </Typography>

                    {order.notes && (
                      <Alert severity="info" sx={{ py: 0.5, mb: 2 }}>
                        Notas: {order.notes}
                      </Alert>
                    )}

                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      Items ({items.length}):
                    </Typography>

                    <Box sx={{ bgcolor: '#fafafa', p: 1.5, borderRadius: 1, mb: 2 }}>
                      {items.map((item) => {
                        const itemConfig = itemStatusConfig[item.status] || itemStatusConfig.PENDING;
                        return (
                          <Box
                            key={item.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 0.75,
                              borderBottom: '1px dashed #eee',
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {item.quantity}x {item.dish?.name || 'Plato'}
                              </Typography>
                              {item.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  Obs: {item.notes}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={itemConfig.label}
                                color={itemConfig.color}
                                size="small"
                                variant="outlined"
                              />
                              {item.status === 'READY' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckIcon />}
                                  onClick={() => handleDeliverItem(order.id, item.id)}
                                >
                                  Entregar
                                </Button>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {formatCurrency(order.total)}
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        Ver Detalle / Agregar Platos
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<DoneAllIcon />}
                        disabled={!allDelivered}
                        onClick={() => handleCloseOrder(order.id)}
                      >
                        Cerrar y Cobrar
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Historial reciente */}
      {pastOrders.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Historial Reciente
          </Typography>
          <Grid container spacing={2}>
            {pastOrders.slice(0, 6).map((order) => (
              <Grid item xs={12} sm={6} md={4} key={order.id}>
                <Card variant="outlined" sx={{ opacity: 0.85 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        #{order.id} — Mesa #{order.table?.number}
                      </Typography>
                      <Chip
                        label={statusConfig[order.status]?.label || order.status}
                        color={statusConfig[order.status]?.color || 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Total: {formatCurrency(order.total)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Volver
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              confirmDialog.action?.();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}
          >
            Confirmar
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

export default MyOrdersPage;
