import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import CustomerLayout from './components/layout/CustomerLayout';

export default function UserLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  );
}
