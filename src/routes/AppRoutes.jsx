import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home/Home';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import ResetPassword from '@/pages/Auth/ResetPassword';
import Dashboard from '@/pages/Dashboard/Dashboard';
import AdminDashboard from '@/pages/Admin/AdminDashboard';
import AdminPending from '@/pages/Admin/Pending/AdminPending';
import SensorsAdmin from '@/pages/Admin/Sensors/SensorsAdmin';
import AdminAlerts from '@/pages/Admin/Alerts/AdminAlerts';
import AdminMap from '@/pages/Admin/Map/AdminMap';
import AdminUsers from '@/pages/Admin/Users/AdminUsers';
import UserAlerts from '@/pages/Alerts/UserAlerts';
import Map from '@/pages/Map/Map';
import Report from '@/pages/Report/Report';
import Profile from '@/pages/Profile/Profile';
import Notifications from '@/pages/Notifications/Notifications';
import ProtectedRoute from '@/components/layout/ProtectedRoute/ProtectedRoute';
import { ROUTES } from '@/constants/routes';

function Placeholder({ title }) {
  return (
    <main style={{ padding: '8rem 1.5rem', textAlign: 'center' }}>
      <p className="text-eyebrow">Bientôt</p>
      <h1 style={{ marginTop: '1rem' }}>{title}</h1>
      <p style={{ marginTop: '1rem', maxWidth: '40ch', marginInline: 'auto' }}>
        Cette section est en cours de construction. Reviens très bientôt.
      </p>
    </main>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      <Route
        path={ROUTES.REPORT}
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ALERTS}
        element={
          <ProtectedRoute>
            <UserAlerts />
          </ProtectedRoute>
        }
      />
      <Route path={ROUTES.ALERT_DETAIL} element={<Placeholder title="Détail de l'alerte" />} />
      <Route path={ROUTES.MAP} element={<Map />} />

      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_PENDING}
        element={
          <ProtectedRoute requireAdmin>
            <AdminPending />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_ALERTS}
        element={
          <ProtectedRoute requireAdmin>
            <AdminAlerts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_SENSORS}
        element={
          <ProtectedRoute requireAdmin>
            <SensorsAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_MAP}
        element={
          <ProtectedRoute requireAdmin>
            <AdminMap />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_USERS}
        element={
          <ProtectedRoute requireAdmin>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Placeholder title="Page introuvable" />} />
    </Routes>
  );
}
