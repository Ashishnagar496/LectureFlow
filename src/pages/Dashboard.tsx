import React from 'react';
import { useTimetable } from '../context/TimetableContext';
import { useNotification } from '../context/NotificationContext';
import {
  Clock,
  MapPin,
  User,
  Coffee,
  CheckCircle2,
  CalendarDays,
  Upload,
  Bell,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const {
    selectedSection,
    timelineItems,
    currentLecture,
    nextLecture,
    isDayFinished,
    hasNoLecturesToday,
    isHolidayToday,
    currentTimeString,
    currentDateString,
    selectedDayName,
    todayCounts,
    selectedDayOfWeek,
    setSelectedDayOfWeek
  } = useTimetable();

  const { preferences } = useNotification();

  const currentBreak = timelineItems.find((item) => item.type === 'break' && item.status === 'BREAK') || null;

  const daysOfWeek = [
    { num: 1, label: 'Mon' },
    { num: 2, label: 'Tue' },
    { num: 3, label: 'Wed' },
    { num: 4, label: 'Thu' },
    { num: 5, label: 'Fri' },
    { num: 6, label: 'Sat' },
  ];

  const getCategoryLabel = (cat?: string) => {
    if (cat === 'lab') return 'Lab';
    if (cat === 'training') return 'Training';
    return 'Lecture';
  };

  return (
    <div className="space-y-5">

      {/* WIREFRAME SUB-HEADER: Left (Counts) | Center (Today Schedule) | Right (DAY / DATE) */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">

          {/* Left: Today Lectures / Labs / Trainings counts */}
          <div className="flex md:flex-col justify-between md:justify-start gap-2 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-[#9CA3AF]">Today lectures :</span>
              <span className="font-bold text-[#F9FAFB]">{todayCounts.lectures}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[#9CA3AF]">Today labs :</span>
              <span className="font-bold text-[#F9FAFB]">{todayCounts.labs}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[#9CA3AF]">Today trainings :</span>
              <span className="font-bold text-[#F9FAFB]">{todayCounts.trainings}</span>
            </div>
          </div>

          {/* Center: Today Schedule Title + Day Switcher */}
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="px-4 py-1.5 rounded-lg border border-[#1F2937] bg-[#111827] text-white font-medium text-sm">
              Today Schedule
            </div>
            <div className="flex items-center space-x-1 bg-[#0B1120] p-1 rounded-lg border border-[#1F2937]">
              {daysOfWeek.map((day) => {
                const isSelected = selectedDayOfWeek === day.num;
                return (
                  <button
                    key={day.num}
                    onClick={() => setSelectedDayOfWeek(day.num)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#111827]'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: DAY & DATE */}
          <div className="flex md:flex-col items-end justify-between md:justify-center gap-0.5 text-right">
            <div className="text-sm font-bold text-[#F9FAFB] uppercase tracking-wide">
              {selectedDayName}
            </div>
            <div className="text-xs font-normal text-[#9CA3AF]">
              {currentDateString}
            </div>
            <div className="text-xs font-mono font-normal text-[#9CA3AF]">
              {currentTimeString}
            </div>
          </div>

        </div>
      </div>

      {/* Holiday Banner */}
      {isHolidayToday && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3 text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Academic Holiday: {isHolidayToday.description}</p>
            <p className="text-xs text-amber-300">Regular lectures and reminders are suspended today.</p>
          </div>
        </div>
      )}

      {/* CENTRAL CONTAINER: FLOW OF TODAY'S LECTURES */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-4 sm:p-6 space-y-5">

        {/* Live Status Summary Strip */}
        <div className="p-4 rounded-xl bg-[#0B1120] border border-[#2563EB]/30 shadow-[0_0_0_1px_rgba(37,99,235,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {currentLecture ? (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#F9FAFB]">
                    Ongoing Now
                  </span>
                </div>
                <span className="text-xs font-normal text-[#9CA3AF]">
                  {currentLecture.remainingMinutes} min remaining
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">
                  {currentLecture.subject_name}
                </h2>
                <span className="text-xs font-normal text-[#9CA3AF]">
                  {currentLecture.classroom || 'Assigned Room'} &bull; {currentLecture.faculty_name || 'Faculty'}
                </span>
              </div>

              <div className="w-full bg-[#1F2937] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentLecture.progressPercent || 20}%` }}
                />
              </div>
            </div>
          ) : currentBreak ? (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#F9FAFB]">
                    Ongoing Break
                  </span>
                </div>
                <span className="text-xs font-normal text-[#9CA3AF]">
                  {currentBreak.remainingMinutes} min remaining
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h2 className="text-base sm:text-lg font-bold text-[#F9FAFB]">
                  {currentBreak.subject_name}
                </h2>
                <span className="text-xs font-normal text-[#9CA3AF]">
                  {currentBreak.start_time} – {currentBreak.end_time}
                  {nextLecture ? ` • Next: ${nextLecture.subject_name} (${nextLecture.classroom || 'Room'})` : ''}
                </span>
              </div>

              <div className="w-full bg-[#1F2937] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentBreak.progressPercent || 20}%` }}
                />
              </div>
            </div>
          ) : isDayFinished ? (
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-[#6B7280] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#F9FAFB]">All lectures completed for today</p>
                <p className="text-xs font-normal text-[#9CA3AF]">See you tomorrow morning.</p>
              </div>
            </div>
          ) : hasNoLecturesToday ? (
            <div className="flex items-center space-x-3">
              <Coffee className="w-5 h-5 text-[#6B7280] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#F9FAFB]">No scheduled lectures today</p>
                <p className="text-xs font-normal text-[#9CA3AF]">Enjoy your free day.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
              <div className="flex items-center space-x-3">
                <Coffee className="w-5 h-5 text-[#6B7280] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#F9FAFB]">No ongoing lecture right now</p>
                  <p className="text-xs font-normal text-[#9CA3AF]">
                    {nextLecture
                      ? `Next: ${nextLecture.subject_name} at ${nextLecture.start_time} (${nextLecture.classroom || 'Room'})`
                      : 'No upcoming lectures remaining today.'}
                  </p>
                </div>
              </div>
              {nextLecture && nextLecture.startsInMinutes !== undefined && (
                <span className="text-xs font-normal text-[#9CA3AF] bg-[#111827] px-3 py-1 rounded-lg border border-[#1F2937] self-start sm:self-center">
                  Starts in {nextLecture.startsInMinutes}m
                </span>
              )}
            </div>
          )}

          {/* Next Lecture Mini Callout when a class is ongoing */}
          {currentLecture && nextLecture && (
            <div className="sm:border-l sm:border-[#1F2937] sm:pl-4 shrink-0 text-xs space-y-0.5">
              <span className="text-[11px] font-normal uppercase tracking-wider text-[#9CA3AF] block">
                Up Next ({nextLecture.start_time})
              </span>
              <span className="font-semibold text-[#F9FAFB] block">
                {nextLecture.subject_name}
              </span>
              <span className="font-normal text-[#9CA3AF] block">
                {nextLecture.classroom || 'Room'} &bull; in {nextLecture.startsInMinutes}m
              </span>
            </div>
          )}
        </div>

        {/* Flow Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h3 className="text-base font-bold text-[#F9FAFB]">
              Flow of Today&apos;s Lectures
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              {selectedSection?.section_name || 'Section'} &bull; {selectedDayName}
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-[11px] text-[#9CA3AF]">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span>Ongoing</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span>Upcoming</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6B7280]"></span>
              <span>Completed</span>
            </span>
          </div>
        </div>

        {/* Vertical Timeline Flow */}
        {timelineItems.length > 0 ? (
          <div className="relative pl-6 sm:pl-7 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-px before:bg-brand-border">
            {timelineItems.map((item) => {
              const isOngoing = item.status === 'ONGOING';
              const isActiveBreak = item.type === 'break' && item.status === 'BREAK';
              const isHighlighted = isOngoing || isActiveBreak;
              const isCompleted = item.status === 'COMPLETED';
              const isBreak = item.type === 'break';

              return (
                <div key={item.id} className="relative">
                  {/* Crisp Timeline Dot (No neon glow) */}
                  <div
                    className={`absolute -left-[1.45rem] sm:-left-[1.7rem] top-4 w-3 h-3 rounded-full border-2 ${
                      isHighlighted
                        ? 'bg-[#22C55E] border-[#111827] ring-2 ring-[#22C55E]/30'
                        : isCompleted
                        ? 'bg-[#6B7280] border-[#111827]'
                        : isBreak
                        ? 'bg-[#111827] border-[#1F2937]'
                        : 'bg-[#2563EB] border-[#111827]'
                    }`}
                  />

                  <div
                    className={`p-4 rounded-xl border transition-colors ${
                      isHighlighted
                        ? 'bg-[#166534]/20 border-[#22C55E]/50 border-l-4 border-l-[#22C55E]'
                        : isCompleted
                        ? 'bg-[#111827] border-[#1F2937] opacity-75'
                        : isBreak
                        ? 'bg-[#0B1120] border-dashed border-[#1F2937]'
                        : 'bg-[#111827] border-[#1F2937] hover:border-[#374151]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-normal text-[#9CA3AF]">
                            {item.start_time} – {item.end_time}
                          </span>
                          {item.type === 'lecture' && (
                            <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-[#0B1120] text-[#9CA3AF] border border-[#1F2937]">
                              {getCategoryLabel(item.category)}
                            </span>
                          )}
                          {item.subject_code && (
                            <span className="text-[11px] font-mono font-normal text-[#9CA3AF]">
                              {item.subject_code}
                            </span>
                          )}
                          {isHighlighted && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#166534] text-white">
                              Ongoing
                            </span>
                          )}
                          {isBreak && (
                            <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[#1F2937] text-[#9CA3AF]">
                              Break
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm sm:text-base font-bold ${isCompleted ? 'text-[#9CA3AF]' : 'text-[#F9FAFB]'}`}>
                          {item.subject_name}
                        </h4>

                        {item.type === 'lecture' && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-normal text-[#9CA3AF] pt-0.5">
                            {item.classroom && (
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                                <span>{item.classroom}</span>
                              </span>
                            )}
                            {item.faculty_name && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3.5 h-3.5 text-[#6B7280]" />
                                <span>{item.faculty_name}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        {isHighlighted && (
                          <span className="inline-block text-xs font-semibold text-[#4ADE80]">
                            {item.remainingMinutes}m left
                          </span>
                        )}
                        {!isHighlighted && item.startsInMinutes !== undefined && item.startsInMinutes > 0 && (
                          <span className="inline-flex items-center space-x-1 text-xs font-normal text-[#9CA3AF]">
                            <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                            <span>in {item.startsInMinutes}m</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs font-normal text-[#9CA3AF]">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center space-y-2">
            <Coffee className="w-10 h-10 text-[#6B7280] mx-auto" />
            <p className="text-sm font-semibold text-[#F9FAFB]">No Scheduled Sessions</p>
            <p className="text-xs font-normal text-[#9CA3AF]">
              No lectures, labs, or trainings are scheduled for {selectedDayName}.
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM FUNCTIONALITY BAR (matches Image 1's bottom options bar on Desktop & Web) */}
      <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            to="/timetable"
            className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B1120] hover:bg-[#1F2937] text-xs font-medium text-[#F9FAFB] transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-[#6B7280]" />
            <span>Weekly Timetable</span>
          </Link>

          <Link
            to="/select-section"
            className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B1120] hover:bg-[#1F2937] text-xs font-medium text-[#F9FAFB] transition-colors"
          >
            <Layers className="w-4 h-4 text-[#6B7280]" />
            <span>Switch Section</span>
          </Link>

          <Link
            to="/admin/upload"
            className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B1120] hover:bg-[#1F2937] text-xs font-medium text-[#F9FAFB] transition-colors"
          >
            <Upload className="w-4 h-4 text-[#6B7280]" />
            <span>Upload (.xlsx)</span>
          </Link>

          <Link
            to="/notifications"
            className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B1120] hover:bg-[#1F2937] text-xs font-medium text-[#F9FAFB] transition-colors"
          >
            <Bell className="w-4 h-4 text-[#6B7280]" />
            <span>
              {preferences?.enabled
                ? preferences?.whatsapp_enabled
                  ? 'WhatsApp Alerts On'
                  : 'Alerts On'
                : 'Setup Alerts'}
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
};
