import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import orderService from '../services/orderService';
import tableService from '../services/tableService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);

const statusConfig = {
  OPEN: { label: 'Abierto', color: 'info' },
  IN_PROGRESS: { label: 'En Progreso', color: 'warning' },
  READY: { label: 'Listo', color: 'success' },
  CLOSED: { label: 'Cerrado', color: 'default' },
  CANCELLED: { label: 'Cancelado', color: 'error' },
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (tableFilter) filters.tableId = tableFilter;
      const response = await orderService.getAll(filters);
      setOrders(response.data || response || []);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tableFilter]);

  const fetchTables = useCallback(async () => {
    try {
      const response = await tableService.getAll();
      setTables(response.data || response || []);
    } catch (err) {
      console.error('Error cargando mesas:', err);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const getTableNumber = (order) => {
    if (order.table?.number) return order.table.number;
    const table = tables.find(
      (t) => (t.id || t._id) === (order.tableId || order.table?.id || order.table?._id)
    );
    return table?.number || '-';
  };

  const getWaiterName = (order) => {
    return order.waiter?.name || order.user?.name || '-';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (loading && orders.length === 0) return <LoadingSpinner message="Cargando pedidos..." />;

  return (
    <Box>
      <PageHeader title="Pedidos" subtitle="Historial y gestión de pedidos" />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Estado"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="OPEN">Abierto</MenuItem>
            <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
            <MenuItem value="READY">Listo</MenuItem>
            <MenuItem value="CLOSED">Cerrado</MenuItem>
            <MenuItem value="CANCELLED">Cancelado</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Mesa</InputLabel>
          <Select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            label="Mesa"
          >
            <MenuItem value="">Todas</MenuItem>
            {tables.map((table) => (
              <MenuItem key={table.id || table._id} value={table.id || table._id}>
                Mesa {table.number}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Mesa</TableCell>
                <TableCell>Mozo</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No se encontraron pedidos</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const status = statusConfig[order.status] || {
                    label: order.status,
                    color: 'default',
                  };
                  return (
                    <TableRow
                      key={order.id || order._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/orders/${order.id || order._id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>
                        #{order.orderNumber || order.id || order._id}
                      </TableCell>
                      <TableCell>Mesa {getTableNumber(order)}</TableCell>
                      <TableCell>{getWaiterName(order)}</TableCell>
                      <TableCell align="center">
                        <Chip label={status.label} color={status.color} size="small" />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id || order._id}`);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default OrdersPage;
