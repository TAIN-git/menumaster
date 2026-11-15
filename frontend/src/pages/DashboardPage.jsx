import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TableBar as TableBarIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import statsService from '../services/statsService';
import PageHeader from '../components/PageHeader';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);

const CHART_COLORS = ['#E65100', '#FF833A', '#2E7D32', '#60AD5E', '#0288D1', '#D32F2F', '#7B1FA2', '#F57C00'];

const StatCard = ({ title, value, icon, color, loading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={100} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700} color={color}>
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [topDishes, setTopDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, topRes] = await Promise.all([
        statsService.getDashboard(),
        statsService.getTopDishes(7),
      ]);
      setStats(dashRes.data || dashRes);
      const dishes = topRes.data || topRes;
      setTopDishes(Array.isArray(dishes) ? dishes : []);
      setError('');
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error al cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle="Resumen general del restaurante" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ventas del Día"
            value={formatCurrency(stats?.totalSalesToday)}
            icon={<MoneyIcon sx={{ color: '#2E7D32', fontSize: 32 }} />}
            color="#2E7D32"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pedidos del Día"
            value={stats?.ordersToday ?? '-'}
            icon={<ReceiptIcon sx={{ color: '#E65100', fontSize: 32 }} />}
            color="#E65100"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Mesas Ocupadas"
            value={stats?.occupiedTables ?? '-'}
            icon={<TableBarIcon sx={{ color: '#0288D1', fontSize: 32 }} />}
            color="#0288D1"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pedidos Abiertos"
            value={stats?.openOrders ?? '-'}
            icon={<PendingIcon sx={{ color: '#7B1FA2', fontSize: 32 }} />}
            color="#7B1FA2"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Platos (Últimos 7 días)
          </Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={300} />
          ) : topDishes.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topDishes} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value, 'Cantidad']}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                  {topDishes.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No hay datos disponibles</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
