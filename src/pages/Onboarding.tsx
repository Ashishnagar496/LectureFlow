import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimetable } from '../context/TimetableContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, School, BookOpen, Layers, ArrowRight } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { departments, sections } = useTimetable();
  const { toggleMasterNotifications } = useNotification();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '11111111-1111-1111-1111-111111111111');
  const [semester, setSemester] = useState(6);
  const [sectionId, setSectionId] = useState(sections[0]?.id || 'a1111111-1111-1111-1111-111111111111');
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const availableSections = sections.filter(
    (s) => s.department_id === departmentId && s.semester === semester
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const chosenSectionId = sectionId || (availableSections[0]?.id || sections[0].id);

      await completeOnboarding({
        fullName,
        departmentId,
        semester,
        sectionId: chosenSectionId
      });

      if (enableAlerts) {
        try {
          await toggleMasterNotifications(true);
        } catch {
          // Continue
        }
      }

      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Student Onboarding</h1>
          <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
            Choose your department, semester, and section to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111827] rounded-2xl border border-[#1F2937] p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Aarav Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1 flex items-center space-x-1">
                <School className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Department</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.department_name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Semester</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Section</span>
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none font-semibold text-[#F9FAFB]"
            >
              {(availableSections.length > 0 ? availableSections : sections).map((s) => (
                <option key={s.id} value={s.id}>{s.section_name} (Sem {s.semester})</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-xl border border-[#1F2937] bg-brand-bg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#F9FAFB] block">Enable Browser Push Reminders</span>
              <span className="text-[11px] text-[#9CA3AF]">Free alerts 10 minutes before class</span>
            </div>
            <input
              type="checkbox"
              checked={enableAlerts}
              onChange={(e) => setEnableAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#2563EB] rounded"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>{submitting ? 'Saving...' : 'Continue to Today Schedule'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
