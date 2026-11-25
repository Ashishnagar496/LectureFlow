export type UserRole = 'student' | 'admin' | 'faculty';

export interface Department {
  id: string;
  department_name: string;
  code: string;
  created_at?: string;
}

export interface Section {
  id: string;
  department_id: string;
  semester: number;
  section_name: string;
  department?: Department;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  department_id?: string | null;
  semester?: number | null;
  section_id?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  preferred_channel?: 'whatsapp' | 'sms' | 'browser_push';
  role: UserRole;
  is_onboarded: boolean;
  department?: Department;
  section?: Section;
  created_at?: string;
}

export interface Timetable {
  id: string;
  title: string;
  academic_year: string;
  semester: number;
  uploaded_by?: string;
  file_path?: string;
  version: number;
  status: 'draft' | 'review' | 'published' | 'archived';
  is_active: boolean;
  created_at?: string;
}

export interface Lecture {
  id: string;
  timetable_id: string;
  section_id: string;
  day_of_week: number; // 1=Mon, 2=Tue, ..., 6=Sat, 7=Sun
  subject_name: string;
  subject_code?: string | null;
  faculty_name?: string | null;
  classroom?: string | null;
  start_time: string;
  end_time: string;
  section?: Section;
  created_at?: string;
}

export type LectureTimelineStatus = 'COMPLETED' | 'ONGOING' | 'UPCOMING' | 'BREAK' | 'FREE';
export type SessionCategory = 'lecture' | 'lab' | 'training';

export interface TimelineItem {
  id: string;
  type: 'lecture' | 'break' | 'free';
  category?: SessionCategory;
  subject_name: string;
  subject_code?: string;
  faculty_name?: string;
  classroom?: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  status: LectureTimelineStatus;
  progressPercent?: number;
  remainingMinutes?: number;
  startsInMinutes?: number;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  enabled: boolean;
  browser_push_enabled: boolean;
  whatsapp_enabled: boolean; // Prioritized messaging channel
  sms_enabled: boolean;      // Optional SMS fallback
  whatsapp_number?: string;
  sms_number?: string;
  reminder_minutes: 5 | 10 | 15 | 30;
  quiet_hours_start: string;
  quiet_hours_end: string;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  lecture_id?: string | null;
  channel: 'whatsapp' | 'sms' | 'browser_push' | 'test';
  scheduled_at?: string;
  sent_at: string;
  delivery_status: 'sent' | 'failed' | 'delivered' | 'skipped' | 'preview';
  message_preview?: string;
  error_message?: string | null;
  idempotency_key?: string;
}

export interface Holiday {
  id: string;
  date: string;
  description: string;
  department_id?: string;
}

export interface ExtractedLectureEntry {
  id: string;
  department: string;
  semester: number;
  section: string;
  day_of_week: number;
  day_name: string;
  subject_name: string;
  subject_code?: string;
  faculty_name?: string;
  classroom?: string;
  start_time: string;
  end_time: string;
  confidence: number;
  notes?: string;
}
