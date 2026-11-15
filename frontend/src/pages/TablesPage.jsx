import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableBar as TableBarIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import tableService from '../services/tableService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const statusConfig = {
  AVAILABLE: { label: 'Disponible', color: 'success' },
  OCCUPIED: { label: 'Ocupada', color: 'warning' },
  RESERVED: { label: 'Reservada', color: 'info' },
};

const initialForm = { number: '', capacity: '' };

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchTables = useCallback(async () => {
    try {
      const response = await tableService.getAll();
      setTables(response.data || response || []);
    } catch (err) {
      console.error('Error cargando mesas:', err);
      showSnackbar('Error al cargar las mesas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (table = null) => {
    if (table) {
      setEditingTable(table);
      setForm({
        number: table.number?.toString() || '',
        capacity: table.capacity?.toString() || '',
      });
    } else {
      setEditingTable(null);
      setForm(initialForm);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTable(null);
    setForm(initialForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.number || parseInt(form.number) <= 0) errors.number = 'Ingrese un número válido';
    if (!form.capacity || parseInt(form.capacity) <= 0)
      errors.capacity = 'Ingrese una capacidad válida';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    const data = {
      number: parseInt(form.number),
      capacity: parseInt(form.capacity),
    };

    try {
      if (editingTable) {
        await tableService.update(editingTable.id || editingTable._id, data);
        showSnackbar('Mesa actualizada exitosamente');
      } else {
        await tableService.create(data);
        showSnackbar('Mesa creada exitosamente');
      }
      handleCloseDialog();
      fetchTables();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al guardar la mesa';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await tableService.remove(deletingId);
      showSnackbar('Mesa eliminada exitosamente');
      fetchTables();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar la mesa';
      showSnackbar(message, 'error');
    } finally {
      setConfirmOpen(false);
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando mesas..." />;

  return (
    <Box>
      <PageHeader
        title="Mesas"
        subtitle="Administra las mesas del restaurante"
        actionLabel="Nueva Mesa"
        actionIcon={<AddIcon />}
        onAction={() => handleOpenDialog()}
      />

      {tables.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TableBarIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No hay mesas registradas</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tables.map((table) => {
            const status = statusConfig[table.status] || statusConfig.AVAILABLE;
            return (
              <Grid item xs={6} sm={4} md={3} lg={2} key={table.id || table._id}>
                <Card
                  sx={{
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardContent>
                    <TableBarIcon
                      sx={{
                        fontSize: 48,
                        color:
                          table.status === 'OCCUPIED'
                            ? 'warning.main'
                            : table.status === 'RESERVED'
                            ? 'info.main'
                            : 'success.main',
                        mb: 1,
                      }}
                    />
                    <Typography variant="h5" fontWeight={700}>
                      Mesa {table.number}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        my: 1,
                      }}
                    >
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {table.capacity} personas
                      </Typography>
                    </Box>
                    <Chip label={status.label} color={status.color} size="small" />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(table)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(table.id || table._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editingTable ? 'Editar Mesa' : 'Nueva Mesa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Número de mesa"
              type="number"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              error={!!formErrors.number}
              helperText={formErrors.number}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Capacidad (personas)"
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              error={!!formErrors.capacity}
              helperText={formErrors.capacity}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : editingTable ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar Mesa"
        message="¿Estás seguro de que deseas eliminar esta mesa?"
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

export default TablesPage;
