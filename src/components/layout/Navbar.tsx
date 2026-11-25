import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTimetable } from '../../context/TimetableContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, BellOff, GraduationCap, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user } = useAuth();
  const { selectedSection } = useTimetable();
  const { preferences } = useNotification();

  const isNotificationsEnabled = preferences?.enabled;

  return (
    <header className="sticky top-0 z-30 bg-[#0B1120] border-b border-[#1F2937]">
      <div className="max-w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Hamburger Menu (works on both desktop & mobile) + Brand */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-[#F9FAFB] hover:bg-[#111827] transition-colors focus:outline-none"
            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#F9FAFB]">
                LectureFlow
              </span>
              {selectedSection && (
                <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-[#111827] text-[#F9FAFB] border border-[#1F2937]">
                  {selectedSection.section_name} &bull; Sem {selectedSection.semester}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Right: Notification Indicator + Circular Profile Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <Link
            to="/notifications"
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isNotificationsEnabled
                ? 'bg-[#166534] text-white border-[#166534] hover:bg-[#15803d]'
                : 'bg-[#111827] text-[#9CA3AF] border-[#1F2937] hover:text-[#F9FAFB]'
            }`}
            title="Notification Settings"
          >
            {isNotificationsEnabled ? (
              <>
                <Bell className="w-3.5 h-3.5 text-white" />
                <span>Alerts On</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-[#9CA3AF]" />
                <span>Alerts Off</span>
              </>
            )}
          </Link>

          {/* Circular Profile Avatar */}
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold text-sm border border-[#1F2937] hover:bg-[#1D4ED8] transition-colors"
            title="Profile & Quick Settings"
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S'}
          </Link>
        </div>

      </div>
    </header>
  );
};
