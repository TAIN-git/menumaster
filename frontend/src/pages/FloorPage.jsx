import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
} from '@mui/material';
import {
  TableBar as TableIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import tableService from '../services/tableService';
import orderService from '../services/orderService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const statusConfig = {
  AVAILABLE: { label: 'Disponible', color: 'success', bgColor: '#e8f5e9' },
  OCCUPIED: { label: 'Ocupada', color: 'warning', bgColor: '#fff3e0' },
  RESERVED: { label: 'Reservada', color: 'info', bgColor: '#e3f2fd' },
};

const FloorPage = () => {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tablesRes, ordersRes] = await Promise.all([
        tableService.getAll(),
        orderService.getAll({ status: 'OPEN,IN_PROGRESS,READY' }),
      ]);
      setTables(tablesRes.data || []);
      setActiveOrders(ordersRes.data || []);
    } catch (err) {
      setError('Error al cargar el plano del salón');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getTableOrder = (tableId) => {
    return activeOrders.find((o) => o.tableId === tableId && ['OPEN', 'IN_PROGRESS', 'READY'].includes(o.status));
  };

  const handleTableClick = (table) => {
    const order = getTableOrder(table.id);
    if (order) {
      navigate(`/orders/${order.id}`);
    } else {
      navigate(`/new-order?tableId=${table.id}`);
    }
  };

  if (loading && tables.length === 0) {
    return <LoadingSpinner message="Cargando plano del salón..." />;
  }

  return (
    <Box>
      <PageHeader
        title="Plano del Salón"
        subtitle="Estado de mesas en tiempo real y toma de pedidos"
        actionLabel="Actualizar"
        actionIcon={<RefreshIcon />}
        onAction={fetchData}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Resumen de estado */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<TableIcon />}
          label={`Total: ${tables.length} mesas`}
          variant="outlined"
        />
        <Chip
          color="success"
          label={`Disponibles: ${tables.filter((t) => t.status === 'AVAILABLE').length}`}
        />
        <Chip
          color="warning"
          label={`Ocupadas: ${tables.filter((t) => t.status === 'OCCUPIED').length}`}
        />
        <Chip
          color="info"
          label={`Reservadas: ${tables.filter((t) => t.status === 'RESERVED').length}`}
        />
      </Box>

      {/* Grid de mesas */}
      <Grid container spacing={3}>
        {tables.map((table) => {
          const config = statusConfig[table.status] || statusConfig.AVAILABLE;
          const order = getTableOrder(table.id);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={table.id}>
              <Card
                onClick={() => handleTableClick(table)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: config.bgColor,
                  border: '2px solid',
                  borderColor: `${config.color}.main`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="h6" fontWeight="bold">
                      Mesa #{table.number}
                    </Typography>
                    <Chip
                      size="small"
                      label={config.label}
                      color={config.color}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body2">
                      Capacidad: {table.capacity} personas
                    </Typography>
                  </Box>

                  {order ? (
                    <Box sx={{ pt: 1, borderTop: '1px dashed #ccc' }}>
                      <Typography variant="body2" color="text.secondary">
                        Pedido #{order.id}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Mozo: {order.waiter?.name || 'Asignado'}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 1 }}
                        startIcon={<ReceiptIcon />}
                      >
                        Ver Pedido
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ pt: 1, borderTop: '1px dashed #ccc' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        fullWidth
                        sx={{ mt: 1 }}
                        startIcon={<AddIcon />}
                      >
                        Nuevo Pedido
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default FloorPage;
