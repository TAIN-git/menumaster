import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout, { ProtectedRoute } from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import DishesPage from './pages/DishesPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import CashRegisterPage from './pages/CashRegisterPage';
import FloorPage from './pages/FloorPage';
import NewOrderPage from './pages/NewOrderPage';
import MyOrdersPage from './pages/MyOrdersPage';
import KitchenPage from './pages/KitchenPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Componente para redirigir a la vista principal según el rol
const RoleBasedRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case 'ADMIN':
      return <Navigate to="/dashboard" replace />;
    case 'WAITER':
      return <Navigate to="/floor" replace />;
    case 'KITCHEN':
      return <Navigate to="/kitchen" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas dentro del Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Index redirige según rol */}
          <Route index element={<RoleBasedRedirect />} />

          {/* Rutas ADMIN */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="categories"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dishes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DishesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="tables"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TablesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="cash-register"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <CashRegisterPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas WAITER y ADMIN */}
          <Route
            path="floor"
            element={
              <ProtectedRoute allowedRoles={['WAITER', 'ADMIN']}>
                <FloorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="new-order"
            element={
              <ProtectedRoute allowedRoles={['WAITER', 'ADMIN']}>
                <NewOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-orders"
            element={
              <ProtectedRoute allowedRoles={['WAITER', 'ADMIN']}>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute allowedRoles={['WAITER', 'ADMIN', 'KITCHEN']}>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas KITCHEN y ADMIN */}
          <Route
            path="kitchen"
            element={
              <ProtectedRoute allowedRoles={['KITCHEN', 'ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
