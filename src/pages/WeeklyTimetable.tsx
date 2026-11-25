import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { CalendarDays, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = [
  { num: 1, name: 'Monday' },
  { num: 2, name: 'Tuesday' },
  { num: 3, name: 'Wednesday' },
  { num: 4, name: 'Thursday' },
  { num: 5, name: 'Friday' },
  { num: 6, name: 'Saturday' },
];

export const WeeklyTimetable: React.FC = () => {
  const { allSectionLectures, selectedSection } = useTimetable();
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'day'>('grid');

  const lecturesByDay = (dayNum: number) => {
    return allSectionLectures
      .filter((l) => l.day_of_week === dayNum)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-[#9CA3AF] text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4 text-[#60A5FA]" />
            <span>Master Schedule</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">Weekly Timetable</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Section <strong className="text-[#F9FAFB]">{selectedSection?.section_name}</strong> &bull; Semester {selectedSection?.semester || 6}
          </p>
        </div>

        <div className="hidden md:flex bg-[#111827] border border-[#1F2937] rounded-xl p-1 items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-[#2563EB] text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'day' ? 'bg-[#2563EB] text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
            }`}
          >
            Day-by-Day
          </button>
        </div>
      </div>

      {/* Day-by-Day View (Always on mobile, optional on desktop) */}
      <div className={viewMode === 'day' ? 'block' : 'block md:hidden'}>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#111827] p-2 rounded-xl border border-[#1F2937]">
            <button
              onClick={() => setSelectedMobileDay((prev) => (prev > 1 ? prev - 1 : 6))}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827]"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex space-x-1 overflow-x-auto py-1">
              {DAYS.map((d) => (
                <button
                  key={d.num}
                  onClick={() => setSelectedMobileDay(d.num)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedMobileDay === d.num
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#111827]'
                  }`}
                >
                  {d.name.slice(0, 3)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedMobileDay((prev) => (prev < 6 ? prev + 1 : 1))}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827]"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-5 space-y-3">
            <h2 className="text-base font-bold text-[#F9FAFB]">
              {DAYS.find((d) => d.num === selectedMobileDay)?.name} Schedule
            </h2>
            {lecturesByDay(selectedMobileDay).length > 0 ? (
              lecturesByDay(selectedMobileDay).map((lec) => (
                <div key={lec.id} className="p-4 rounded-xl border border-[#1F2937] bg-[#111827] space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-[#60A5FA]">
                      {lec.start_time.substring(0, 5)} – {lec.end_time.substring(0, 5)}
                    </span>
                    {lec.subject_code && (
                      <span className="text-[11px] font-mono text-[#9CA3AF]">{lec.subject_code}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#F9FAFB]">{lec.subject_name}</h3>
                  <div className="flex flex-wrap gap-x-4 text-xs text-[#9CA3AF] pt-0.5">
                    {lec.classroom && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                        <span>{lec.classroom}</span>
                      </span>
                    )}
                    {lec.faculty_name && (
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-[#60A5FA]" />
                        <span>{lec.faculty_name}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-[#9CA3AF]">No classes scheduled.</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Weekly Grid */}
      {viewMode === 'grid' && (
        <div className="hidden md:block bg-[#111827] rounded-2xl border border-[#1F2937] overflow-hidden">
          <div className="grid grid-cols-6 divide-x divide-brand-border border-b border-[#1F2937] bg-brand-bg">
            {DAYS.map((d) => (
              <div key={d.num} className="p-3 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F9FAFB]">{d.name}</span>
                <span className="block text-[10px] text-[#9CA3AF] mt-0.5">{lecturesByDay(d.num).length} sessions</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-6 divide-x divide-brand-border min-h-[420px]">
            {DAYS.map((d) => {
              const dayLecs = lecturesByDay(d.num);
              return (
                <div key={d.num} className="p-2 space-y-2 bg-[#111827]">
                  {dayLecs.map((lec) => (
                    <div
                      key={lec.id}
                      className="p-2.5 rounded-xl border border-[#1F2937] bg-[#111827] space-y-1 hover:border-brand-secondary/60 transition-colors"
                    >
                      <div className="text-[11px] font-mono font-medium text-[#60A5FA]">
                        {lec.start_time.substring(0, 5)} – {lec.end_time.substring(0, 5)}
                      </div>
                      <div className="text-xs font-bold text-[#F9FAFB] leading-snug">
                        {lec.subject_name}
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] truncate">{lec.classroom}</div>
                      {lec.faculty_name && (
                        <div className="text-[10px] text-[#9CA3AF] truncate">{lec.faculty_name}</div>
                      )}
                    </div>
                  ))}
                  {dayLecs.length === 0 && (
                    <div className="py-12 text-center text-[11px] text-[#9CA3AF]">No classes</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
