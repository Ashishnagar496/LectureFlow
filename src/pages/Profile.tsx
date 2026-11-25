import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimetable } from '../context/TimetableContext';
import { useNotification } from '../context/NotificationContext';
import {
  Upload,
  Bell,
  ChevronRight,
  CheckCircle2,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { departments, sections, selectedSection } = useTimetable();
  const { preferences, toggleMasterNotifications } = useNotification();

  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || 'Aarav Sharma');
  const [savedMsg, setSavedMsg] = useState('');

  const currentDept = departments.find((d) => d.id === selectedSection?.department_id);

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    await completeOnboarding({
      fullName: fullName.trim(),
      departmentId: user?.department_id || departments[0]?.id || '',
      semester: user?.semester || 6,
      sectionId: user?.section_id || sections[0]?.id || ''
    });
    setEditingName(false);
    setSavedMsg('Profile updated.');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleToggleNotifications = async (checked: boolean) => {
    try {
      await toggleMasterNotifications(checked);
    } catch {
      // Handled gracefully
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">

      {savedMsg && (
        <div className="p-3 rounded-xl border border-[#166534] bg-[#166534] text-[#60A5FA] flex items-center space-x-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#60A5FA] shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Circular Profile Avatar + Profile Name */}
      <div className="py-3 flex flex-col items-center text-center space-y-2">
        <div className="w-20 h-20 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-2xl border-4 border-[#111827] shadow-sm">
          {fullName ? fullName.charAt(0).toUpperCase() : 'S'}
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#F9FAFB]">{fullName}</h1>
          <p className="text-xs text-[#9CA3AF]">{user?.email || 'student@college.edu'}</p>
        </div>
      </div>

      {/* Stacked Clean Cards */}
      <div className="space-y-3">

        {/* Row 1: User Name */}
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                User Name
              </span>
              {editingName ? (
                <div className="mt-1.5 flex items-center space-x-2">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[#1F2937] rounded-lg text-sm bg-[#0B1120] text-[#F9FAFB] focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[#F9FAFB] mt-0.5">{fullName}</p>
              )}
            </div>
            {!editingName && (
              <button
                onClick={() => setEditingName(true)}
                className="text-xs font-semibold text-[#60A5FA] hover:text-[#F9FAFB]"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Department / Section */}
        <Link
          to="/select-section"
          className="block bg-[#111827] rounded-2xl border border-[#1F2937] p-4 hover:border-[#60A5FA] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                Department / Section
              </span>
              <p className="text-sm font-semibold text-[#F9FAFB] mt-0.5">
                {currentDept?.code || 'CSE'} &bull; {selectedSection?.section_name || 'CSE-15'} (Semester {selectedSection?.semester || 6})
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </div>
        </Link>

        {/* Row 3: Upload Timetable File (.xlsx) */}
        <Link
          to="/admin/upload"
          className="block bg-[#111827] rounded-2xl border border-[#1F2937] p-4 hover:border-[#60A5FA] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Upload className="w-4 h-4 text-[#60A5FA] shrink-0" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                  Upload Timetable File (.xlsx / .csv / .pdf)
                </span>
                <p className="text-sm font-semibold text-[#F9FAFB] mt-0.5">
                  Import &amp; update class schedule
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </div>
        </Link>

        {/* Row 4: 1-Click Web/PWA Push Notification Toggle */}
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4 text-[#60A5FA] shrink-0" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                  Push Notifications
                </span>
                <p className="text-sm font-semibold text-[#F9FAFB] mt-0.5">
                  {preferences?.enabled ? 'Notifications Enabled' : 'Notifications Off'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={preferences?.enabled || false}
              aria-label="Toggle Lecture Notifications"
              onClick={() => handleToggleNotifications(!(preferences?.enabled || false))}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                preferences?.enabled ? 'bg-[#2563EB]' : 'bg-[#374151]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform ${
                  preferences?.enabled ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-[#D1D5DB]'
                }`}
              />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
