import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Department, Section, Timetable, Lecture, TimelineItem, Holiday, SessionCategory } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';

interface TimetableContextType {
  departments: Department[];
  sections: Section[];
  selectedSection: Section | null;
  activeTimetable: Timetable | null;
  allSectionLectures: Lecture[];
  todayLectures: Lecture[];
  timelineItems: TimelineItem[];
  currentLecture: TimelineItem | null;
  nextLecture: TimelineItem | null;
  isDayFinished: boolean;
  hasNoLecturesToday: boolean;
  isHolidayToday: Holiday | null;
  currentTimeString: string;
  currentDateString: string;
  selectedDayName: string;
  todayCounts: {
    lectures: number;
    labs: number;
    trainings: number;
  };
  selectedDayOfWeek: number;
  setSelectedDayOfWeek: (day: number) => void;
  setSelectedSectionId: (sectionId: string) => void;
  refreshTimetable: () => Promise<void>;
  loading: boolean;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function classifySession(subjectName: string, subjectCode?: string | null): SessionCategory {
  const nameLower = subjectName.toLowerCase();
  const codeUpper = (subjectCode || '').toUpperCase();
  if (nameLower.includes('lab') || codeUpper.endsWith('L')) {
    return 'lab';
  }
  if (
    nameLower.includes('training') ||
    nameLower.includes('workshop') ||
    nameLower.includes('seminar') ||
    nameLower.includes('project') ||
    nameLower.includes('mentorship') ||
    nameLower.includes('talk') ||
    codeUpper.endsWith('W') ||
    codeUpper.endsWith('P') ||
    codeUpper.endsWith('G') ||
    codeUpper.startsWith('TR')
  ) {
    return 'training';
  }
  return 'lecture';
}

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserSection } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTimetable, setActiveTimetable] = useState<Timetable | null>(null);
  const [allSectionLectures, setAllSectionLectures] = useState<Lecture[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const currentActualDayOfWeek = useMemo(() => {
    const day = currentTime.getDay();
    return day === 0 ? 7 : day;
  }, [currentTime]);

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => {
    const day = new Date().getDay();
    return day === 0 ? 1 : day;
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [depts, secs, tt, hols] = await Promise.all([
        dataService.getDepartments(),
        dataService.getSections(),
        dataService.getActiveTimetable(),
        dataService.getHolidays()
      ]);
      setDepartments(depts);
      setSections(secs);
      setActiveTimetable(tt);
      setHolidays(hols);
    } catch (e) {
      console.error('Error loading academic data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedSection = useMemo(() => {
    if (!sections.length) return null;
    if (user?.section_id) {
      const found = sections.find(s => s.id === user.section_id);
      if (found) return found;
    }
    return sections[0];
  }, [sections, user?.section_id]);

  const loadSectionLectures = useCallback(async () => {
    if (!selectedSection) return;
    try {
      const lecs = await dataService.getLecturesForSection(selectedSection.id);
      setAllSectionLectures(lecs);
    } catch (err) {
      console.error('Error loading lectures:', err);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadSectionLectures();
  }, [loadSectionLectures]);

  const setSelectedSectionId = async (sectionId: string) => {
    await updateUserSection(sectionId);
    const lecs = await dataService.getLecturesForSection(sectionId);
    setAllSectionLectures(lecs);
  };

  const refreshTimetable = async () => {
    await loadInitialData();
    await loadSectionLectures();
  };

  const todayLectures = useMemo(() => {
    return allSectionLectures
      .filter(l => l.day_of_week === selectedDayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [allSectionLectures, selectedDayOfWeek]);

  const todayCounts = useMemo(() => {
    let lectures = 0;
    let labs = 0;
    let trainings = 0;

    for (const lec of todayLectures) {
      const cat = classifySession(lec.subject_name, lec.subject_code);
      if (cat === 'lab') labs++;
      else if (cat === 'training') trainings++;
      else lectures++;
    }
    return { lectures, labs, trainings };
  }, [todayLectures]);

  const isHolidayToday = useMemo(() => {
    const todayStr = currentTime.toISOString().split('T')[0];
    return holidays.find(h => h.date === todayStr) || null;
  }, [holidays, currentTime]);

  const timelineItems = useMemo(() => {
    if (!todayLectures.length) return [];

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isTodayView = selectedDayOfWeek === currentActualDayOfWeek;
    const items: TimelineItem[] = [];

    for (let i = 0; i < todayLectures.length; i++) {
      const current = todayLectures[i];
      const startMin = timeToMinutes(current.start_time);
      const endMin = timeToMinutes(current.end_time);

      if (i > 0) {
        const prev = todayLectures[i - 1];
        const prevEndMin = timeToMinutes(prev.end_time);
        const gap = startMin - prevEndMin;

        if (gap >= 10) {
          const isLunch = prevEndMin >= 12 * 60 && startMin <= 14 * 60;
          const breakSubject = isLunch ? 'Lunch & Recess Break' : 'Short Break';

          let breakStatus: TimelineItem['status'] = 'UPCOMING';
          let progress = 0;
          let remaining = 0;

          if (isTodayView) {
            if (nowMinutes >= prevEndMin && nowMinutes < startMin) {
              breakStatus = 'BREAK';
              progress = Math.min(100, Math.max(0, ((nowMinutes - prevEndMin) / gap) * 100));
              remaining = startMin - nowMinutes;
            } else if (nowMinutes >= startMin) {
              breakStatus = 'COMPLETED';
            }
          }

          items.push({
            id: `break_${i}`,
            type: 'break',
            subject_name: breakSubject,
            start_time: prev.end_time.substring(0, 5),
            end_time: current.start_time.substring(0, 5),
            status: breakStatus,
            progressPercent: progress,
            remainingMinutes: remaining
          });
        }
      }

      let status: TimelineItem['status'] = 'UPCOMING';
      let progressPercent = 0;
      let remainingMinutes = 0;
      let startsInMinutes = 0;

      if (isTodayView) {
        if (nowMinutes >= endMin) {
          status = 'COMPLETED';
        } else if (nowMinutes >= startMin && nowMinutes < endMin) {
          status = 'ONGOING';
          const duration = endMin - startMin;
          progressPercent = Math.min(100, Math.max(0, ((nowMinutes - startMin) / duration) * 100));
          remainingMinutes = endMin - nowMinutes;
        } else {
          status = 'UPCOMING';
          startsInMinutes = startMin - nowMinutes;
        }
      }

      items.push({
        id: current.id,
        type: 'lecture',
        category: classifySession(current.subject_name, current.subject_code),
        subject_name: current.subject_name,
        subject_code: current.subject_code || undefined,
        faculty_name: current.faculty_name || undefined,
        classroom: current.classroom || undefined,
        start_time: current.start_time.substring(0, 5),
        end_time: current.end_time.substring(0, 5),
        status,
        progressPercent,
        remainingMinutes,
        startsInMinutes
      });
    }

    return items;
  }, [todayLectures, currentTime, selectedDayOfWeek, currentActualDayOfWeek]);

  const currentLecture = useMemo(() => {
    if (selectedDayOfWeek !== currentActualDayOfWeek) return null;
    return timelineItems.find(item => item.status === 'ONGOING' && item.type === 'lecture') || null;
  }, [timelineItems, selectedDayOfWeek, currentActualDayOfWeek]);

  const nextLecture = useMemo(() => {
    if (selectedDayOfWeek !== currentActualDayOfWeek) return null;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return timelineItems.find(item => {
      if (item.type !== 'lecture') return false;
      return timeToMinutes(item.start_time) > nowMinutes;
    }) || null;
  }, [timelineItems, currentTime, selectedDayOfWeek, currentActualDayOfWeek]);

  const isDayFinished = useMemo(() => {
    if (selectedDayOfWeek !== currentActualDayOfWeek || !todayLectures.length) return false;
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const lastEndMin = timeToMinutes(todayLectures[todayLectures.length - 1].end_time);
    return nowMinutes >= lastEndMin;
  }, [todayLectures, currentTime, selectedDayOfWeek, currentActualDayOfWeek]);

  const hasNoLecturesToday = todayLectures.length === 0;

  const currentTimeString = useMemo(() => {
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }, [currentTime]);

  const currentDateString = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [currentTime]);

  const selectedDayName = useMemo(() => {
    const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return names[selectedDayOfWeek] || currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  }, [selectedDayOfWeek, currentTime]);

  return (
    <TimetableContext.Provider
      value={{
        departments,
        sections,
        selectedSection,
        activeTimetable,
        allSectionLectures,
        todayLectures,
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
        setSelectedDayOfWeek,
        setSelectedSectionId,
        refreshTimetable,
        loading
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (!context) throw new Error('useTimetable must be used within a TimetableProvider');
  return context;
};
