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
  IconButton,
  Chip,
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
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PersonOff as PersonOffIcon,
} from '@mui/icons-material';
import userService from '../services/userService';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const roleConfig = {
  ADMIN: { label: 'Administrador', color: 'secondary' },
  WAITER: { label: 'Mesero', color: 'info' },
  KITCHEN: { label: 'Cocina', color: 'warning' },
};

const initialForm = { name: '', email: '', password: '', role: 'WAITER' };

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data || response || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      showSnackbar('Error al cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'WAITER',
      });
    } else {
      setEditingUser(null);
      setForm(initialForm);
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setForm(initialForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.email.trim()) errors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email inválido';
    if (!editingUser && !form.password.trim()) errors.password = 'La contraseña es obligatoria';
    if (!editingUser && form.password.length > 0 && form.password.length < 6)
      errors.password = 'Mínimo 6 caracteres';
    if (!form.role) errors.role = 'Seleccione un rol';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingUser) {
        const updateData = { name: form.name, email: form.email, role: form.role };
        await userService.update(editingUser.id || editingUser._id, updateData);
        showSnackbar('Usuario actualizado exitosamente');
      } else {
        await userService.create(form);
        showSnackbar('Usuario creado exitosamente');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al guardar el usuario';
      showSnackbar(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateClick = (id) => {
    setDeactivatingId(id);
    setConfirmOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    try {
      await userService.remove(deactivatingId);
      showSnackbar('Usuario desactivado exitosamente');
      fetchUsers();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al desactivar el usuario';
      showSnackbar(message, 'error');
    } finally {
      setConfirmOpen(false);
      setDeactivatingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando usuarios..." />;

  return (
    <Box>
      <PageHeader
        title="Usuarios"
        subtitle="Administra los usuarios del sistema"
        actionLabel="Nuevo Usuario"
        actionIcon={<AddIcon />}
        onAction={() => handleOpenDialog()}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Rol</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const roleInfo = roleConfig[user.role] || {
                    label: user.role,
                    color: 'default',
                  };
                  return (
                    <TableRow key={user.id || user._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell align="center">
                        <Chip label={roleInfo.label} color={roleInfo.color} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.isActive !== false ? 'Activo' : 'Inactivo'}
                          color={user.isActive !== false ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Desactivar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeactivateClick(user.id || user._id)}
                          >
                            <PersonOffIcon />
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
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
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
              required
            />
            {!editingUser && (
              <TextField
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={!!formErrors.password}
                helperText={formErrors.password}
                fullWidth
                required
              />
            )}
            <FormControl fullWidth required error={!!formErrors.role}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                label="Rol"
              >
                <MenuItem value="ADMIN">Administrador</MenuItem>
                <MenuItem value="WAITER">Mesero</MenuItem>
                <MenuItem value="KITCHEN">Cocina</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Desactivar Usuario"
        message="¿Estás seguro de que deseas desactivar este usuario? No podrá acceder al sistema."
        onConfirm={handleDeactivateConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setDeactivatingId(null);
        }}
        confirmText="Desactivar"
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

export default UsersPage;
