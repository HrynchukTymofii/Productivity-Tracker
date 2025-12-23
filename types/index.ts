// Task type definition
export interface Task {
  id: number;
  task_name: string;
  color: string;
  created_at: string;
  updated_at: string | null;
}

// Time entry type definition
export interface TimeEntry {
  id: number;
  task_id: number;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  is_paused: boolean;
  paused_at: string | null;
  accumulated_seconds: number;
  notes: string | null;
  date: string;
}

// Time entry with task info for display purposes
export interface TimeEntryWithTask extends TimeEntry {
  task_name: string;
  color: string;
}

// Theme mode type
export type ThemeMode = 'light' | 'dark' | 'system';

// Settings type definition
export interface Settings {
  id: number;
  color_palette: string;
  language: string;
  theme_mode: ThemeMode;
  created_at: string;
  updated_at: string | null;
}

// Timer state type
export interface TimerState {
  activeTaskId: number | null;
  activeEntryId: number | null;
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  startTime: Date | null;
}

// Color palette type
export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  preview: string[]; // First 5 colors for preview
}

// Language type
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

// Statistics types
export interface DailyStats {
  date: string;
  totalSeconds: number;
  sessionCount: number;
}

export interface TaskStats {
  taskId: number;
  taskName: string;
  color: string;
  totalSeconds: number;
  sessionCount: number;
  percentage: number;
}

export interface HourlyStats {
  hour: number;
  dayOfWeek: number;
  totalSeconds: number;
}

export interface SummaryStats {
  totalFocusTime: number;
  averageDailyFocusTime: number;
  totalSessions: number;
  mostProductiveDay: string | null;
  mostProductiveHour: number | null;
  longestSession: number;
}

// Date range for statistics
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  FullScreenTimer: { taskId: number; taskName: string };
  TaskDetail: { taskId: number };
};

export type MainTabParamList = {
  Today: undefined;
  Timer: undefined;
  Statistics: undefined;
  Settings: undefined;
};

// Theme type
export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    success: string;
    warning: string;
    error: string;
    surface: string;
    surfaceVariant: string;
    onSurface: string;
    placeholder: string;
  };
}

// Export data types
export interface ExportData {
  dateRange: DateRange;
  entries: TimeEntryWithTask[];
  taskStats: TaskStats[];
  dailyStats: DailyStats[];
  summaryStats: SummaryStats;
}

// Planner slot type for day view
export interface PlannerSlot {
  id: number;
  taskId: number;
  taskName: string;
  color: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isActive: boolean;
  isPaused: boolean;
}
