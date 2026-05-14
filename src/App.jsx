import { BrowserRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import Header from '@/components/layout/Header/Header';
import Footer from '@/components/layout/Footer/Footer';
import InstallPrompt from '@/components/common/InstallPrompt/InstallPrompt';
import AppRoutes from '@/routes/AppRoutes';

const CHROMELESS_PREFIXES = ['/tableau-de-bord', '/admin', '/notifications'];

function Shell() {
  const location = useLocation();
  const hideChrome = CHROMELESS_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <>
      {!hideChrome && <Header />}
      <AppRoutes />
      {!hideChrome && <Footer />}
      <InstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationsProvider>
            <Shell />
          </NotificationsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
