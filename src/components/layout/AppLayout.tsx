import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-4 shadow-[0_24px_56px_-42px_rgba(22,24,28,0.5)] backdrop-blur sm:p-7">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
