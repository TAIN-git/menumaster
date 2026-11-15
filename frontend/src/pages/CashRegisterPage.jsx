import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import cashRegisterService from '../services/cashRegisterService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);

const CashRegisterPage = () => {
  const [register, setRegister] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingAmount, setOpeningAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchRegister = useCallback(async () => {
    try {
      const response = await cashRegisterService.getToday();
      setRegister(response.data || response || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setRegister(null);
      } else {
        console.error('Error cargando caja:', err);
        showSnackbar('Error al cargar el estado de la caja', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegister();
  }, [fetchRegister]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpen = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      setAmountError('Ingrese un monto válido');
      return;
    }
    setAmountError('');
    setSubmitting(true);
    try {
      await cashRegisterService.open({ openingAmount: parseFloat(openingAmount) });
      showSnackbar('Caja abierta exitosamente');
      setOpeningAmount('');
      fetchRegister();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al abrir la caja';
      showSnackbar(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    setSubmitting(true);
    try {
      await cashRegisterService.close();
      showSnackbar('Caja cerrada exitosamente');
      setConfirmClose(false);
      fetchRegister();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cerrar la caja';
      showSnackbar(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = () => {
    if (!register) return 'NOT_OPENED';
    return register.status || (register.closedAt ? 'CLOSED' : 'OPEN');
  };

  if (loading) return <LoadingSpinner message="Cargando caja..." />;

  const status = getStatus();

  return (
    <Box>
      <PageHeader title="Caja Registradora" subtitle="Control de caja del día" />

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <PointOfSaleIcon
                  sx={{
                    fontSize: 64,
                    color:
                      status === 'OPEN'
                        ? 'success.main'
                        : status === 'CLOSED'
                        ? 'error.main'
                        : 'text.disabled',
                  }}
                />
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {status === 'OPEN'
                    ? 'Caja Abierta'
                    : status === 'CLOSED'
                    ? 'Caja Cerrada'
                    : 'Caja No Abierta'}
                </Typography>
                <Chip
                  label={
                    status === 'OPEN'
                      ? 'ABIERTA'
                      : status === 'CLOSED'
                      ? 'CERRADA'
                      : 'SIN ABRIR'
                  }
                  color={
                    status === 'OPEN' ? 'success' : status === 'CLOSED' ? 'error' : 'default'
                  }
                  sx={{ mt: 1 }}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {status === 'NOT_OPENED' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Abrir Caja
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ingrese el monto inicial para abrir la caja del día.
                  </Typography>
                  <TextField
                    label="Monto de apertura"
                    type="number"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    error={!!amountError}
                    helperText={amountError}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />}
                    onClick={handleOpen}
                    disabled={submitting}
                  >
                    {submitting ? 'Abriendo...' : 'Abrir Caja'}
                  </Button>
                </Box>
              )}

              {status === 'OPEN' && (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Monto Apertura
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="info.main">
                          {formatCurrency(register?.openingAmount)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Ventas Totales
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {formatCurrency(register?.totalSales)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Actual
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {formatCurrency(
                            (register?.openingAmount || 0) + (register?.totalSales || 0)
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    fullWidth
                    startIcon={<LockIcon />}
                    onClick={() => setConfirmClose(true)}
                  >
                    Cerrar Caja
                  </Button>
                </Box>
              )}

              {status === 'CLOSED' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Resumen del Día
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Monto Apertura
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="info.main">
                          {formatCurrency(register?.openingAmount)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Ventas Totales
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {formatCurrency(register?.totalSales)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Cierre
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          {formatCurrency(register?.closingAmount)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmClose}
        title="Cerrar Caja"
        message="¿Estás seguro de que deseas cerrar la caja del día? Esta acción no se puede deshacer."
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
        confirmText="Cerrar Caja"
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

export default CashRegisterPage;
