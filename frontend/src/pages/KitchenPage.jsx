import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Alert,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import {
  CheckCircle as ReadyIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Restaurant as DishIcon,
  TableBar as TableIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import kitchenService from '../services/kitchenService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const KitchenPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const res = await kitchenService.getQueue();
      setItems(res.data || []);
    } catch (err) {
      setError('Error al actualizar la comanda de cocina');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 8000); // Poll cada 8s
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleMarkReady = async (itemId) => {
    try {
      setUpdatingId(itemId);
      await kitchenService.markReady(itemId);
      // Actualizar vista localmente
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al marcar plato como listo');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && items.length === 0) return <LoadingSpinner message="Cargando comandas de cocina..." />;

  return (
    <Box>
      <PageHeader
        title="Comandas de Cocina"
        subtitle="Visualización y despacho de platos en tiempo real"
        actionLabel="Actualizar"
        actionIcon={<RefreshIcon />}
        onAction={fetchQueue}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Barra de estado rápido */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold">
          Platos por preparar: {items.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Actualización automática activa (cada 8 seg)
        </Typography>
      </Paper>

      {items.length === 0 ? (
        <Alert severity="success" sx={{ py: 4, fontSize: '1.2rem', textAlign: 'center' }}>
          ¡Felicitaciones! No hay platos pendientes en cocina en este momento.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => {
            const tableNumber = item.order?.table?.number || item.order?.tableId || '?';
            const timeAgo = item.created_at
              ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })
              : 'recién';

            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  variant="outlined"
                  sx={{
                    border: '2px solid',
                    borderColor: 'warning.main',
                    bgcolor: '#fffde7',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxShadow: 3,
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        icon={<TableIcon />}
                        label={`Mesa #${tableNumber}`}
                        color="primary"
                        sx={{ fontSize: '1rem', py: 2, fontWeight: 'bold' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <TimeIcon fontSize="small" />
                        <Typography variant="caption" fontWeight="bold">
                          {timeAgo}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="h4" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
                      {item.quantity}x {item.dish?.name || 'Plato'}
                    </Typography>

                    {item.notes ? (
                      <Paper sx={{ p: 1, bgcolor: '#ffecb3', mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="error.dark">
                          Observación: {item.notes}
                        </Typography>
                      </Paper>
                    ) : null}

                    <Typography variant="caption" color="text.secondary">
                      Pedido #{item.order?.id || item.orderId}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      fullWidth
                      startIcon={<ReadyIcon />}
                      disabled={updatingId === item.id}
                      onClick={() => handleMarkReady(item.id)}
                      sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
                    >
                      {updatingId === item.id ? 'Marcando...' : '¡LISTO PARA SERVIR!'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default KitchenPage;
