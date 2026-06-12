import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface-900">
      <Sidebar />
      <main className="ml-56 min-h-screen bg-grid-pattern bg-grid transition-all duration-300">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
