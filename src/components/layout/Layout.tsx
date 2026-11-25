import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { LayoutDashboard, CalendarDays, Upload, Bell, User } from 'lucide-react';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const bottomItems = [
    { to: '/dashboard', label: 'Today', icon: LayoutDashboard },
    { to: '/timetable', label: 'Weekly', icon: CalendarDays },
    { to: '/admin/upload', label: 'Upload', icon: Upload },
    { to: '/notifications', label: 'Alerts', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans pb-16 lg:pb-0">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex-1 flex">
        <Sidebar
          open={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        <main className={`flex-1 transition-all duration-200 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'}`}>
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Quick-Functionality Bar on mobile & tablet */}
      <nav
        aria-label="Quick navigation"
        className="fixed bottom-0 inset-x-0 z-30 bg-[#0B1120] border-t border-[#1F2937] lg:hidden"
      >
        <div className="grid grid-cols-5 h-16 max-w-xl mx-auto">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center space-y-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'text-[#60A5FA] font-semibold'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#60A5FA]' : 'text-[#9CA3AF]'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
