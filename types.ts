
// Domain Models

export type TeacherRole = 'CLASS_TEACHER' | 'SUBJECT_TEACHER' | 'ADMIN'; 
export type SchoolLevel = 'SD' | 'SMP' | 'SMA' | 'SMK'; 
export type AssessmentType = 'FORMATIVE' | 'SUMMATIVE'; // Added Type
export type EventType = 'HOLIDAY' | 'EXAM' | 'MEETING' | 'OTHER'; // New Event Type

// AUTH TYPES
export interface User {
  id: string;
  email: string;
  name: string;
  role: TeacherRole;
  level?: SchoolLevel; 
  isActive: boolean;
  lastLogin?: string;
  password?: string; // Added: Plain Text Password for Admin View
}

// CALENDAR EVENT TYPE
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO Date YYYY-MM-DD
  description?: string;
  type: EventType;
}

// STORAGE WRAPPER 
export interface UserStorageData {
  identity: IdentityData;
  students: Student[];
  classes: ClassInfo[];
  schedules: ScheduleItem[];
  tps: LearningObjective[];
  subject: Subject;
  attendanceData: AttendanceData;
  gradeData: GradeData;
  journals: JournalEntry[]; 
  calendarEvents: CalendarEvent[]; // Added calendar events
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  className?: string; 
}

export interface ClassInfo {
  id: string;
  name: string; 
  level: string; 
  studentCount: number;
}

export interface ScheduleItem {
  id: string;
  day: string; 
  startTime: string; 
  endTime: string; 
  className: string;
  subject: string;
  room: string;
}

export interface LearningMaterial { 
  id: string;
  code: string; 
  title: string;
}

export interface AssessmentCriteria { 
  id: string;
  code: string; 
  description: string; 
  type: AssessmentType; // Added field for Grading Formula
}

export interface LearningObjective { 
  id: string;
  code: string; 
  description: string;
  semester?: 1 | 2; 
  scopeId?: string; // ID Fase atau Kelas (misal: 'Fase E', 'Kelas 1')
  subjectId?: string; // ID Mata Pelajaran (misal: 'Matematika', 'IPA')
  scope?: string; // NEW: Nama Lingkup Materi (e.g., "Aljabar", "Geometri")
  lms: LearningMaterial[]; 
  criteria: AssessmentCriteria[]; 
}

export interface Subject {
  id: string;
  name: string;
  kktp: number; 
}

// JOURNAL TYPES
export interface JournalEntry {
  id: string;
  date: string;
  scheduleId?: string; 
  subjectName: string; 
  className: string;
  startTime: string;
  endTime: string;
  tpId: string; 
  lmId?: string; 
  activity: string; 
  reflection: string; 
  followUp: string; 
  created_at: string;
}

// UPDATED GRADE DATA STRUCTURE
export interface GradeData {
  [studentId: string]: {
    // Formative: Checkbox based (Tercapai/Belum) per Criteria ID
    formative: { [criteriaId: string]: boolean }; 
    // Summative: Score based (0-100) per Lingkup Materi (Scope Name)
    summative: { [scopeName: string]: number };
    // Legacy support / Direct criteria scoring (optional, kept for transition)
    scores?: { [criteriaId: string]: number }; 
    attitude: number; 
  };
}

export interface CalculatedGrade {
  avgFormative: number; // Percentage of criteria achieved
  avgSummative: number; // Average of scope scores
  finalScore: number;
  isPassed: boolean;
}

// Identity Data
export interface IdentityData {
  role: TeacherRole; 
  level: SchoolLevel; 
  schoolName: string;
  subjectName: string; 
  teacherName: string;
  nip: string;
  semester: string;
  academicYear: string;
  className: string; 
  studentCount: number;
}

export type AttendanceStatus = 'H' | 'I' | 'S' | 'A'; 

export interface AttendanceRecord {
   status: AttendanceStatus;
   notes?: string;
}

export interface AttendanceData {
  [scheduleId: string]: {
      [date: string]: {
          [studentId: string]: AttendanceRecord
      }
  };
}

export enum TabView {
  LOGIN = 'LOGIN',
  ADMIN_PANEL = 'ADMIN_PANEL',
  DASHBOARD = 'DASHBOARD',
  CLASS_MASTER = 'CLASS_MASTER', 
  STUDENT_MASTER = 'STUDENT_MASTER',
  SCHEDULE_MASTER = 'SCHEDULE_MASTER',
  IDENTITY = 'IDENTITY', 
  CURRICULUM = 'CURRICULUM', 
  CP_GENERATOR = 'CP_GENERATOR',
  GRADING = 'GRADING',
  ATTENDANCE = 'ATTENDANCE',
  RECAP_GRADES = 'RECAP_GRADES',      
  RECAP_ATTENDANCE = 'RECAP_ATTENDANCE',
  JOURNAL = 'JOURNAL',
  CALENDAR = 'CALENDAR' // New Tab
}
