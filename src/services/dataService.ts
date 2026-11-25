import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Department,
  Section,
  Profile,
  Timetable,
  Lecture,
  NotificationPreferences,
  NotificationLog,
  Holiday,
  ExtractedLectureEntry
} from '../types';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '11111111-1111-1111-1111-111111111111', department_name: 'Computer Science & Engineering', code: 'CSE' },
  { id: '22222222-2222-2222-2222-222222222222', department_name: 'Information Technology', code: 'IT' },
  { id: '33333333-3333-3333-3333-333333333333', department_name: 'Electronics & Communication', code: 'ECE' }
];

const DEFAULT_SECTIONS: Section[] = [
  { id: 'sec_cse_5_11', department_id: '11111111-1111-1111-1111-111111111111', semester: 5, section_name: 'CSE-11' },
  { id: 'sec_cse_5_12', department_id: '11111111-1111-1111-1111-111111111111', semester: 5, section_name: 'CSE-12' },
  { id: 'sec_cse_5_13', department_id: '11111111-1111-1111-1111-111111111111', semester: 5, section_name: 'CSE-13' },
  { id: 'sec_cse_5_14', department_id: '11111111-1111-1111-1111-111111111111', semester: 5, section_name: 'CSE-14' },
  { id: 'sec_cse_5_15', department_id: '11111111-1111-1111-1111-111111111111', semester: 5, section_name: 'CSE-15' },
  { id: 'sec_cse_5_16', department_id: '11111111-1111-1111-1111-111111111111', semester: 5, section_name: 'CSE-16' },
  { id: 'a1111111-1111-1111-1111-111111111111', department_id: '11111111-1111-1111-1111-111111111111', semester: 6, section_name: 'CSE-15' },
  { id: 'a2222222-2222-2222-2222-222222222222', department_id: '11111111-1111-1111-1111-111111111111', semester: 6, section_name: 'CSE-16' },
  { id: 'a3333333-3333-3333-3333-333333333333', department_id: '11111111-1111-1111-1111-111111111111', semester: 6, section_name: 'CSE-17' },
  { id: 'a4444444-4444-4444-4444-444444444444', department_id: '11111111-1111-1111-1111-111111111111', semester: 6, section_name: 'CSE-18' },
  { id: 'b1111111-1111-1111-1111-111111111111', department_id: '22222222-2222-2222-2222-222222222222', semester: 6, section_name: 'IT-15' },
  { id: 'b2222222-2222-2222-2222-222222222222', department_id: '22222222-2222-2222-2222-222222222222', semester: 6, section_name: 'IT-16' }
];

const DEFAULT_TIMETABLES: Timetable[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    title: 'Spring 2026 Master Timetable (B.Tech Sem 6)',
    academic_year: '2025-2026',
    semester: 6,
    version: 1,
    status: 'published',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_LECTURES: Lecture[] = [
  // Monday CSE-15
  { id: 'l101', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 1, subject_name: 'Database Management Systems', subject_code: 'CS601', faculty_name: 'Dr. Ramesh Sharma', classroom: 'Room 301', start_time: '09:00:00', end_time: '10:00:00' },
  { id: 'l102', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 1, subject_name: 'Compiler Design', subject_code: 'CS602', faculty_name: 'Prof. Sunita Rao', classroom: 'Room 302', start_time: '10:00:00', end_time: '11:00:00' },
  { id: 'l103', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 1, subject_name: 'Computer Networks', subject_code: 'CS603', faculty_name: 'Dr. Alok Verma', classroom: 'Room 301', start_time: '11:15:00', end_time: '12:15:00' },
  { id: 'l104', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 1, subject_name: 'DBMS Lab (Batch A & B)', subject_code: 'CS601L', faculty_name: 'Dr. Ramesh Sharma / T.A.', classroom: 'Lab 3', start_time: '13:00:00', end_time: '15:00:00' },
  { id: 'l105', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 1, subject_name: 'Placement & Aptitude Training', subject_code: 'TR601', faculty_name: 'T&P Cell', classroom: 'Seminar Hall', start_time: '15:15:00', end_time: '16:15:00' },

  // Tuesday CSE-15
  { id: 'l201', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 2, subject_name: 'Computer Networks', subject_code: 'CS603', faculty_name: 'Dr. Alok Verma', classroom: 'Room 301', start_time: '09:00:00', end_time: '10:00:00' },
  { id: 'l202', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 2, subject_name: 'Design and Analysis of Algorithms', subject_code: 'CS605', faculty_name: 'Prof. Arvind N.', classroom: 'Room 304', start_time: '10:00:00', end_time: '11:00:00' },
  { id: 'l203', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 2, subject_name: 'Database Management Systems', subject_code: 'CS601', faculty_name: 'Dr. Ramesh Sharma', classroom: 'Room 301', start_time: '11:15:00', end_time: '12:15:00' },
  { id: 'l204', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 2, subject_name: 'Networks Lab', subject_code: 'CS603L', faculty_name: 'Dr. Alok Verma', classroom: 'Networking Lab', start_time: '13:00:00', end_time: '15:00:00' },

  // Wednesday CSE-15
  { id: 'l301', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 3, subject_name: 'Compiler Design', subject_code: 'CS602', faculty_name: 'Prof. Sunita Rao', classroom: 'Room 302', start_time: '09:00:00', end_time: '10:00:00' },
  { id: 'l302', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 3, subject_name: 'Software Engineering', subject_code: 'CS604', faculty_name: 'Dr. Priya Mehta', classroom: 'Room 301', start_time: '10:00:00', end_time: '11:00:00' },
  { id: 'l303', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 3, subject_name: 'Open Elective (AI & ML)', subject_code: 'OE601', faculty_name: 'Dr. Neha Gupta', classroom: 'Auditorium 2', start_time: '11:15:00', end_time: '12:15:00' },
  { id: 'l304', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 3, subject_name: 'Web Development Lab', subject_code: 'CS606L', faculty_name: 'Prof. Rajan S.', classroom: 'Lab 4', start_time: '13:30:00', end_time: '15:30:00' },
  { id: 'l305', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 3, subject_name: 'Technical Coding Training', subject_code: 'TR602', faculty_name: 'Competitive Cell', classroom: 'Lab 2', start_time: '15:45:00', end_time: '16:45:00' },

  // Thursday CSE-15
  { id: 'l401', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 4, subject_name: 'Database Management Systems', subject_code: 'CS601', faculty_name: 'Dr. Ramesh Sharma', classroom: 'Room 301', start_time: '09:00:00', end_time: '10:00:00' },
  { id: 'l402', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 4, subject_name: 'Design and Analysis of Algorithms', subject_code: 'CS605', faculty_name: 'Prof. Arvind N.', classroom: 'Room 304', start_time: '10:00:00', end_time: '11:00:00' },
  { id: 'l403', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 4, subject_name: 'Compiler Design', subject_code: 'CS602', faculty_name: 'Prof. Sunita Rao', classroom: 'Room 302', start_time: '11:15:00', end_time: '12:15:00' },
  { id: 'l404', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 4, subject_name: 'Mini Project Training & Review', subject_code: 'CS607P', faculty_name: 'Faculty Panel', classroom: 'Seminar Hall', start_time: '13:30:00', end_time: '15:30:00' },

  // Friday CSE-15
  { id: 'l501', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 5, subject_name: 'Computer Networks', subject_code: 'CS603', faculty_name: 'Dr. Alok Verma', classroom: 'Room 301', start_time: '09:00:00', end_time: '10:00:00' },
  { id: 'l502', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 5, subject_name: 'Software Engineering', subject_code: 'CS604', faculty_name: 'Dr. Priya Mehta', classroom: 'Room 301', start_time: '10:00:00', end_time: '11:00:00' },
  { id: 'l503', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 5, subject_name: 'Open Elective (AI & ML)', subject_code: 'OE601', faculty_name: 'Dr. Neha Gupta', classroom: 'Auditorium 2', start_time: '11:15:00', end_time: '12:15:00' },
  { id: 'l504', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 5, subject_name: 'Algorithms Lab', subject_code: 'CS605L', faculty_name: 'Prof. Arvind N.', classroom: 'Lab 2', start_time: '13:00:00', end_time: '15:00:00' },

  // Saturday CSE-15
  { id: 'l601', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 6, subject_name: 'Industry Workshop & Soft Skills Training', subject_code: 'TR608W', faculty_name: 'Guest Speaker', classroom: 'Auditorium 1', start_time: '09:30:00', end_time: '11:30:00' },
  { id: 'l602', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a1111111-1111-1111-1111-111111111111', day_of_week: 6, subject_name: 'Mentorship & Remedial Session', subject_code: 'CS609M', faculty_name: 'Mentor Faculty', classroom: 'Room 301', start_time: '11:45:00', end_time: '12:45:00' },

  // CSE-16 lectures
  { id: 'l701', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a2222222-2222-2222-2222-222222222222', day_of_week: 1, subject_name: 'Data Mining & Warehousing', subject_code: 'CS610', faculty_name: 'Dr. S. K. Roy', classroom: 'Room 305', start_time: '09:00:00', end_time: '10:00:00' },
  { id: 'l702', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a2222222-2222-2222-2222-222222222222', day_of_week: 1, subject_name: 'Cloud Computing Infrastructure', subject_code: 'CS611', faculty_name: 'Prof. Monica Das', classroom: 'Room 306', start_time: '10:00:00', end_time: '11:00:00' },
  { id: 'l703', timetable_id: 'c1111111-1111-1111-1111-111111111111', section_id: 'a2222222-2222-2222-2222-222222222222', day_of_week: 3, subject_name: 'Data Mining Lab', subject_code: 'CS610L', faculty_name: 'Dr. S. K. Roy', classroom: 'Lab 1', start_time: '11:15:00', end_time: '13:15:00' }
];

const STORAGE_KEYS = {
  DEPARTMENTS: 'lf_departments',
  SECTIONS: 'lf_sections',
  TIMETABLES: 'lf_timetables',
  LECTURES: 'lf_lectures',
  PREFERENCES: 'lf_preferences',
  LOGS: 'lf_logs',
  PROFILES: 'lf_profiles',
  HOLIDAYS: 'lf_holidays'
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save to localStorage (${key}):`, e);
  }
}

export function initLocalDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    setLocalData(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SECTIONS)) {
    setLocalData(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TIMETABLES)) {
    setLocalData(STORAGE_KEYS.TIMETABLES, DEFAULT_TIMETABLES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LECTURES)) {
    setLocalData(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES);
  }
}

initLocalDatabase();

export const dataService = {
  async getDepartments(): Promise<Department[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('departments').select('*').order('code');
      if (!error && data && data.length > 0) return data;
    }
    return getLocalData<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS);
  },

  async getSections(departmentId?: string, semester?: number): Promise<Section[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('sections').select('*, department:departments(*)').order('section_name');
      if (departmentId) query = query.eq('department_id', departmentId);
      if (semester) query = query.eq('semester', semester);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    const allSections = getLocalData<Section[]>(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
    return allSections.filter(s => {
      if (departmentId && s.department_id !== departmentId) return false;
      if (semester && s.semester !== semester) return false;
      return true;
    });
  },

  async ensureSectionExists(departmentId: string, semester: number, sectionName: string): Promise<Section> {
    const cleanName = sectionName.trim().toUpperCase();
    const allSections = getLocalData<Section[]>(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
    const existing = allSections.find(
      (s) => s.department_id === departmentId && s.semester === semester && s.section_name.toUpperCase() === cleanName
    );
    if (existing) return existing;

    const newSection: Section = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      department_id: departmentId,
      semester,
      section_name: cleanName
    };
    const updated = [...allSections, newSection];
    setLocalData(STORAGE_KEYS.SECTIONS, updated);
    return newSection;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, department:departments(*), section:sections(*)')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) return data;
    }
    const profiles = getLocalData<Record<string, Profile>>(STORAGE_KEYS.PROFILES, {});
    return profiles[userId] || null;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*, department:departments(*), section:sections(*)')
        .single();
      if (!error && data) return data;
    }

    const profiles = getLocalData<Record<string, Profile>>(STORAGE_KEYS.PROFILES, {});
    const existing = profiles[userId] || {
      id: userId,
      full_name: 'Aarav Sharma',
      email: 'aarav.sharma@college.edu',
      role: 'student' as const,
      is_onboarded: false
    };

    const updated = { ...existing, ...updates };
    profiles[userId] = updated;
    setLocalData(STORAGE_KEYS.PROFILES, profiles);
    return updated;
  },

  async getActiveTimetable(): Promise<Timetable | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('timetables')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return data;
    }
    const timetables = getLocalData<Timetable[]>(STORAGE_KEYS.TIMETABLES, DEFAULT_TIMETABLES);
    return timetables.find(t => t.is_active && t.status === 'published') || timetables[0] || null;
  },

  async getAllTimetables(): Promise<Timetable[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('timetables').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalData<Timetable[]>(STORAGE_KEYS.TIMETABLES, DEFAULT_TIMETABLES);
  },

  async getLecturesForSection(sectionId: string, dayOfWeek?: number): Promise<Lecture[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('lectures')
        .select('*, section:sections(*)')
        .eq('section_id', sectionId)
        .order('start_time');
      if (dayOfWeek !== undefined) {
        query = query.eq('day_of_week', dayOfWeek);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }

    const allLectures = getLocalData<Lecture[]>(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES);
    return allLectures
      .filter(l => l.section_id === sectionId && (dayOfWeek === undefined || l.day_of_week === dayOfWeek))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  },

  async publishTimetable(timetableMeta: { title: string; academic_year: string; semester: number }, entries: ExtractedLectureEntry[]): Promise<{ timetable: Timetable; count: number }> {
    const timetableId = 'tt_' + Date.now();
    const newTimetable: Timetable = {
      id: timetableId,
      title: timetableMeta.title,
      academic_year: timetableMeta.academic_year,
      semester: timetableMeta.semester,
      version: 1,
      status: 'published',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const sections = getLocalData<Section[]>(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
    const departments = getLocalData<Department[]>(STORAGE_KEYS.DEPARTMENTS, DEFAULT_DEPARTMENTS);
    const convertedLectures: Lecture[] = [];

    for (const entry of entries) {
      let sec = sections.find(s => s.section_name.toLowerCase() === entry.section.toLowerCase());
      if (!sec) {
        const dept = departments.find(d => d.code.toLowerCase() === entry.department.toLowerCase());
        const deptId = dept ? dept.id : departments[0].id;
        sec = {
          id: 'sec_' + Date.now() + Math.random().toString(36).substring(2, 6),
          department_id: deptId,
          semester: entry.semester || 6,
          section_name: entry.section
        };
        sections.push(sec);
      }

      convertedLectures.push({
        id: 'lec_' + Date.now() + Math.random().toString(36).substring(2, 6),
        timetable_id: timetableId,
        section_id: sec.id,
        day_of_week: entry.day_of_week,
        subject_name: entry.subject_name,
        subject_code: entry.subject_code || null,
        faculty_name: entry.faculty_name || null,
        classroom: entry.classroom || null,
        start_time: entry.start_time.includes(':') && entry.start_time.split(':').length === 2 ? `${entry.start_time}:00` : entry.start_time,
        end_time: entry.end_time.includes(':') && entry.end_time.split(':').length === 2 ? `${entry.end_time}:00` : entry.end_time,
      });
    }

    setLocalData(STORAGE_KEYS.SECTIONS, sections);

    const existingTimetables = getLocalData<Timetable[]>(STORAGE_KEYS.TIMETABLES, DEFAULT_TIMETABLES);
    const updatedTimetables = existingTimetables.map(t => ({ ...t, is_active: false }));
    updatedTimetables.unshift(newTimetable);
    setLocalData(STORAGE_KEYS.TIMETABLES, updatedTimetables);

    const publishedSectionIds = new Set(convertedLectures.map((l) => l.section_id));
    const existingLectures = getLocalData<Lecture[]>(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES);
    const remainingLectures = existingLectures.filter((l) => !publishedSectionIds.has(l.section_id));
    setLocalData(STORAGE_KEYS.LECTURES, [...convertedLectures, ...remainingLectures]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('timetables').update({ is_active: false }).neq('id', 'dummy');
        await supabase.from('timetables').insert([newTimetable]);
        await supabase.from('lectures').insert(convertedLectures);
      } catch (e) {
        console.warn('Supabase remote sync note:', e);
      }
    }

    return { timetable: newTimetable, count: convertedLectures.length };
  },

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return data;
    }

    const allPrefs = getLocalData<Record<string, NotificationPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    if (allPrefs[userId]) return allPrefs[userId];

    return {
      user_id: userId,
      enabled: false,
      browser_push_enabled: false,
      whatsapp_enabled: true, // WhatsApp prioritized over SMS
      sms_enabled: false,
      whatsapp_number: '+91 98765 43210',
      sms_number: '',
      reminder_minutes: 10,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00'
    };
  },

  async updateNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, ...prefs, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (!error && data) return data;
    }

    const allPrefs = getLocalData<Record<string, NotificationPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    const existing = allPrefs[userId] || await this.getNotificationPreferences(userId);
    const updated = { ...existing, ...prefs };
    allPrefs[userId] = updated;
    setLocalData(STORAGE_KEYS.PREFERENCES, allPrefs);
    return updated;
  },

  async getNotificationLogs(userId: string): Promise<NotificationLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(25);
      if (!error && data) return data;
    }

    const logs = getLocalData<NotificationLog[]>(STORAGE_KEYS.LOGS, []);
    return logs.filter(l => l.user_id === userId).sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
  },

  async addNotificationLog(log: Omit<NotificationLog, 'id' | 'sent_at'>): Promise<NotificationLog> {
    const newLog: NotificationLog = {
      ...log,
      id: 'log_' + Date.now(),
      sent_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notification_logs').insert([newLog]);
      } catch (e) {
        console.warn('Supabase remote log sync note:', e);
      }
    }

    const logs = getLocalData<NotificationLog[]>(STORAGE_KEYS.LOGS, []);
    logs.unshift(newLog);
    setLocalData(STORAGE_KEYS.LOGS, logs.slice(0, 100));
    return newLog;
  },

  async getHolidays(): Promise<Holiday[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('holidays').select('*').order('date');
      if (!error && data) return data;
    }
    return getLocalData<Holiday[]>(STORAGE_KEYS.HOLIDAYS, [
      { id: 'h1', date: '2026-01-26', description: 'Republic Day' },
      { id: 'h2', date: '2026-03-04', description: 'Holi Festival' },
      { id: 'h3', date: '2026-04-14', description: 'Ambedkar Jayanti' },
      { id: 'h4', date: '2026-08-15', description: 'Independence Day' },
      { id: 'h5', date: '2026-10-02', description: 'Gandhi Jayanti' }
    ]);
  },

  async getAdminStats() {
    const sections = getLocalData<Section[]>(STORAGE_KEYS.SECTIONS, DEFAULT_SECTIONS);
    const lectures = getLocalData<Lecture[]>(STORAGE_KEYS.LECTURES, DEFAULT_LECTURES);
    const timetables = getLocalData<Timetable[]>(STORAGE_KEYS.TIMETABLES, DEFAULT_TIMETABLES);
    const logs = getLocalData<NotificationLog[]>(STORAGE_KEYS.LOGS, []);

    return {
      activeSectionsCount: sections.length,
      totalLecturesCount: lectures.length,
      publishedTimetablesCount: timetables.filter(t => t.status === 'published').length,
      notificationsSentToday: logs.filter(l => l.sent_at.startsWith(new Date().toISOString().split('T')[0])).length,
      registeredStudentsCount: 142
    };
  }
};
