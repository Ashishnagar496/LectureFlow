import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTimetable } from '../../context/TimetableContext';
import {
  LayoutDashboard,
  CalendarDays,
  Bell,
  User,
  Layers,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onCloseMobile }) => {
  const { logout } = useAuth();
  const { selectedSection, activeTimetable } = useTimetable();

  const navLinks = [
    { to: '/dashboard', label: 'Today Schedule', icon: LayoutDashboard },
    { to: '/timetable', label: 'Weekly Timetable', icon: CalendarDays },
    { to: '/select-section', label: 'Department / Section', icon: Layers },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile & Quick Setup', icon: User },
  ];

  return (
    <>
      {open && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#0B1120] border-r border-[#1F2937] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {selectedSection && (
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mb-1">
                <span className="font-medium">Active Section</span>
                <span className="w-2 h-2 rounded-full bg-[#166534]"></span>
              </div>
              <div className="font-bold text-base text-[#F9FAFB]">
                {selectedSection.section_name}
              </div>
              <div className="text-xs text-[#9CA3AF] mt-0.5">
                Semester {selectedSection.semester}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
              Academic Menu
            </p>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onCloseMobile();
                  }}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#9CA3AF] hover:bg-[#111827] hover:text-[#F9FAFB]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#1F2937] bg-[#0B1120] space-y-2">
          <p className="text-[11px] text-[#9CA3AF] truncate">
            {activeTimetable ? activeTimetable.title : 'Spring 2026 Schedule'}
          </p>
          <button
            onClick={() => {
              onCloseMobile();
              logout();
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827] rounded-lg border border-transparent hover:border-[#1F2937] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
