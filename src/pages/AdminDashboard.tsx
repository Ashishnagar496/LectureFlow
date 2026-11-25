import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimetable } from '../context/TimetableContext';
import { dataService } from '../services/dataService';
import type { Timetable, Holiday } from '../types';
import { Link } from 'react-router-dom';
import { ShieldAlert, Upload, Layers, Calendar, Users, Clock, Plus, Trash2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { sections, refreshTimetable } = useTimetable();

  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [adminStats, setAdminStats] = useState({
    activeSectionsCount: 6,
    totalLecturesCount: 20,
    publishedTimetablesCount: 1,
    notificationsSentToday: 0,
    registeredStudentsCount: 142
  });

  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  useEffect(() => {
    async function fetchAdminData() {
      const [ttList, holList, stats] = await Promise.all([
        dataService.getAllTimetables(),
        dataService.getHolidays(),
        dataService.getAdminStats()
      ]);
      setTimetables(ttList);
      setHolidays(holList);
      setAdminStats(stats);
    }
    fetchAdminData();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayDesc) return;
    const newHol: Holiday = { id: 'hol_' + Date.now(), date: newHolidayDate, description: newHolidayDesc };
    const updated = [...holidays, newHol];
    setHolidays(updated);
    localStorage.setItem('lf_holidays', JSON.stringify(updated));
    setNewHolidayDate('');
    setNewHolidayDesc('');
    await refreshTimetable();
  };

  const handleRemoveHoliday = async (id: string) => {
    const updated = holidays.filter((h) => h.id !== id);
    setHolidays(updated);
    localStorage.setItem('lf_holidays', JSON.stringify(updated));
    await refreshTimetable();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-[#60A5FA]" />
            <span>Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Admin Timetable Management</h1>
        </div>
        <Link
          to="/admin/upload"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Timetable (.xlsx)</span>
        </Link>
      </div>

      {user?.role !== 'admin' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-4">
          <div className="text-xs">
            <strong className="font-semibold">Student View Active:</strong> Switch to Admin Role to manage master timetables.
          </div>
          <button
            onClick={() => switchRole('admin')}
            className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold shrink-0"
          >
            Switch to Admin
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Students</span>
            <Users className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-2xl font-bold text-[#F9FAFB]">{adminStats.registeredStudentsCount}</div>
        </div>
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Sections</span>
            <Layers className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-2xl font-bold text-[#F9FAFB]">{sections.length}</div>
        </div>
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Timetables</span>
            <Calendar className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-2xl font-bold text-[#F9FAFB]">{timetables.length}</div>
        </div>
        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
            <span>Alerts Today</span>
            <Clock className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="text-2xl font-bold text-[#60A5FA]">{adminStats.notificationsSentToday}</div>
        </div>
      </div>

      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#F9FAFB] uppercase tracking-wide pb-2 border-b border-[#1F2937]">
          Published Timetable Versions
        </h2>
        <div className="space-y-2.5">
          {timetables.map((tt) => (
            <div key={tt.id} className="p-3.5 rounded-xl border border-[#1F2937] bg-[#111827] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#F9FAFB]">{tt.title}</p>
                <p className="text-[11px] text-[#9CA3AF]">Session {tt.academic_year} &bull; Sem {tt.semester}</p>
              </div>
              <span className="text-xs font-semibold text-[#60A5FA]">
                {tt.is_active ? 'Active' : tt.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#F9FAFB] uppercase tracking-wide pb-2 border-b border-[#1F2937]">
          Academic Holidays
        </h2>
        <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="date"
            required
            value={newHolidayDate}
            onChange={(e) => setNewHolidayDate(e.target.value)}
            className="px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg"
          />
          <input
            type="text"
            required
            placeholder="Holiday description"
            value={newHolidayDesc}
            onChange={(e) => setNewHolidayDesc(e.target.value)}
            className="px-3 py-2 border border-[#1F2937] rounded-xl text-xs bg-brand-bg"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {holidays.map((hol) => (
            <div key={hol.id} className="p-3 rounded-xl border border-[#1F2937] bg-brand-bg flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-[#F9FAFB] block">{hol.description}</span>
                <span className="font-mono text-[#9CA3AF] text-[11px]">{hol.date}</span>
              </div>
              <button onClick={() => handleRemoveHoliday(hol.id)} className="text-[#9CA3AF] hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
