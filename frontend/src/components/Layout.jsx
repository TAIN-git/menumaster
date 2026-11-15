import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Chip,
  Button,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Category as CategoryIcon,
  Restaurant as RestaurantIcon,
  TableBar as TableBarIcon,
  People as PeopleIcon,
  PointOfSale as PointOfSaleIcon,
  Receipt as ReceiptIcon,
  DiningOutlined as DiningIcon,
  AddCircle as AddCircleIcon,
  ListAlt as ListAltIcon,
  KitchenOutlined as KitchenIcon,
  Logout as LogoutIcon,
  RestaurantMenu as RestaurantMenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const adminMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Categorías', icon: <CategoryIcon />, path: '/categories' },
  { text: 'Platos', icon: <RestaurantIcon />, path: '/dishes' },
  { text: 'Mesas', icon: <TableBarIcon />, path: '/tables' },
  { text: 'Pedidos', icon: <ReceiptIcon />, path: '/orders' },
  { text: 'Usuarios', icon: <PeopleIcon />, path: '/users' },
  { text: 'Caja', icon: <PointOfSaleIcon />, path: '/cash-register' },
];

const waiterMenuItems = [
  { text: 'Salón', icon: <DiningIcon />, path: '/floor' },
  { text: 'Nuevo Pedido', icon: <AddCircleIcon />, path: '/new-order' },
  { text: 'Mis Pedidos', icon: <ListAltIcon />, path: '/my-orders' },
];

const kitchenMenuItems = [
  { text: 'Cola de Pedidos', icon: <KitchenIcon />, path: '/kitchen' },
];

const roleColors = {
  ADMIN: 'secondary',
  WAITER: 'info',
  KITCHEN: 'warning',
};

const roleLabels = {
  ADMIN: 'Administrador',
  WAITER: 'Mesero',
  KITCHEN: 'Cocina',
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getMenuItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'ADMIN':
        return adminMenuItems;
      case 'WAITER':
        return waiterMenuItems;
      case 'KITCHEN':
        return kitchenMenuItems;
      default:
        return [];
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 2.5,
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <RestaurantMenuIcon sx={{ fontSize: 32 }} />
        <Typography variant="h6" fontWeight={700}>
          MenuMaster
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              width: 40,
              height: 40,
              fontSize: 16,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name || 'Usuario'}
            </Typography>
            <Chip
              label={roleLabels[user?.role] || user?.role}
              color={roleColors[user?.role] || 'default'}
              size="small"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {getMenuItems().map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getMenuItems().find((item) => item.path === location.pathname)?.text || 'MenuMaster'}
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {user?.name}
            </Typography>
            <Chip
              label={roleLabels[user?.role] || user?.role}
              color={roleColors[user?.role] || 'default'}
              size="small"
            />
            <Button
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={logout}
            >
              Salir
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const homeRoute =
      user?.role === 'ADMIN'
        ? '/dashboard'
        : user?.role === 'WAITER'
        ? '/floor'
        : '/kitchen';
    return <Navigate to={homeRoute} replace />;
  }

  return children;
};

export default Layout;
