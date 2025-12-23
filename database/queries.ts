import { getDatabase } from './schema';
import {
  Task,
  TimeEntry,
  TimeEntryWithTask,
  Settings,
  DailyStats,
  TaskStats,
  HourlyStats,
  SummaryStats,
  ThemeMode
} from '../types';
import { format, startOfDay, endOfDay } from 'date-fns';

// ==================== TASKS ====================

export const createTask = async (taskName: string, color: string): Promise<number> => {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO tasks (task_name, color, created_at) VALUES (?, ?, datetime("now"))',
    [taskName, color]
  );
  return result.lastInsertRowId;
};

export const updateTaskName = async (taskId: number, newName: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE tasks SET task_name = ?, updated_at = datetime("now") WHERE id = ?',
    [newName, taskId]
  );
};

export const getAllTasks = async (): Promise<Task[]> => {
  const db = await getDatabase();
  const result = await db.getAllAsync<Task>('SELECT * FROM tasks ORDER BY created_at DESC');
  return result;
};

export const getTaskById = async (taskId: number): Promise<Task | null> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Task>('SELECT * FROM tasks WHERE id = ?', [taskId]);
  return result || null;
};

export const getTaskCount = async (): Promise<number> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tasks');
  return result?.count || 0;
};

// ==================== TIME ENTRIES ====================

export const createTimeEntry = async (
  taskId: number,
  startTime: Date
): Promise<number> => {
  const db = await getDatabase();
  const dateStr = format(startTime, 'yyyy-MM-dd');
  const startTimeStr = startTime.toISOString();

  const result = await db.runAsync(
    `INSERT INTO time_entries (task_id, start_time, date, is_paused, accumulated_seconds)
     VALUES (?, ?, ?, 0, 0)`,
    [taskId, startTimeStr, dateStr]
  );
  return result.lastInsertRowId;
};

export const updateTimeEntryEnd = async (
  entryId: number,
  endTime: Date,
  durationSeconds: number
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE time_entries
     SET end_time = ?, duration_seconds = ?, is_paused = 0, paused_at = NULL
     WHERE id = ?`,
    [endTime.toISOString(), durationSeconds, entryId]
  );
};

export const pauseTimeEntry = async (
  entryId: number,
  pausedAt: Date,
  accumulatedSeconds: number
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE time_entries
     SET is_paused = 1, paused_at = ?, accumulated_seconds = ?
     WHERE id = ?`,
    [pausedAt.toISOString(), accumulatedSeconds, entryId]
  );
};

export const resumeTimeEntry = async (
  entryId: number,
  newStartTime: Date
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE time_entries
     SET is_paused = 0, paused_at = NULL, start_time = ?
     WHERE id = ?`,
    [newStartTime.toISOString(), entryId]
  );
};

export const updateTimeEntryDetails = async (
  entryId: number,
  durationSeconds: number,
  notes: string | null
): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE time_entries
     SET duration_seconds = ?, notes = ?
     WHERE id = ?`,
    [durationSeconds, notes, entryId]
  );
};

export const getTimeEntryById = async (entryId: number): Promise<TimeEntry | null> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<TimeEntry>(
    `SELECT * FROM time_entries WHERE id = ?`,
    [entryId]
  );
  return result || null;
};

export const getActiveTimeEntry = async (): Promise<TimeEntry | null> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<TimeEntry>(
    `SELECT * FROM time_entries
     WHERE end_time IS NULL
     ORDER BY start_time DESC LIMIT 1`
  );
  return result || null;
};

export const getLatestTimeEntryForTask = async (taskId: number): Promise<TimeEntry | null> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<TimeEntry>(
    `SELECT * FROM time_entries
     WHERE task_id = ? AND end_time IS NOT NULL
     ORDER BY start_time DESC LIMIT 1`,
    [taskId]
  );
  return result || null;
};

export const getTimeEntriesForDate = async (date: Date): Promise<TimeEntryWithTask[]> => {
  const db = await getDatabase();
  const dateStr = format(date, 'yyyy-MM-dd');

  const result = await db.getAllAsync<TimeEntryWithTask>(
    `SELECT te.*, t.task_name, t.color
     FROM time_entries te
     JOIN tasks t ON te.task_id = t.id
     WHERE te.date = ?
     ORDER BY te.start_time ASC`,
    [dateStr]
  );
  return result;
};

export const getTimeEntriesForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<TimeEntryWithTask[]> => {
  const db = await getDatabase();
  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

  const result = await db.getAllAsync<TimeEntryWithTask>(
    `SELECT te.*, t.task_name, t.color
     FROM time_entries te
     JOIN tasks t ON te.task_id = t.id
     WHERE te.date >= ? AND te.date <= ?
     ORDER BY te.start_time ASC`,
    [startDateStr, endDateStr]
  );
  return result;
};

export const getTotalSecondsForTaskToday = async (taskId: number): Promise<number> => {
  const db = await getDatabase();
  const today = format(new Date(), 'yyyy-MM-dd');

  const result = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(COALESCE(duration_seconds, accumulated_seconds, 0)) as total
     FROM time_entries
     WHERE task_id = ? AND date = ?`,
    [taskId, today]
  );
  return result?.total || 0;
};

// ==================== STATISTICS ====================

export const getDailyStatsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<DailyStats[]> => {
  const db = await getDatabase();
  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

  const result = await db.getAllAsync<DailyStats>(
    `SELECT
       date,
       SUM(COALESCE(duration_seconds, 0)) as totalSeconds,
       COUNT(*) as sessionCount
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL
     GROUP BY date
     ORDER BY date ASC`,
    [startDateStr, endDateStr]
  );
  return result;
};

export const getTaskStatsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<TaskStats[]> => {
  const db = await getDatabase();
  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

  // Get total time first
  const totalResult = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(COALESCE(duration_seconds, 0)) as total
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL`,
    [startDateStr, endDateStr]
  );
  const totalSeconds = totalResult?.total || 0;

  const result = await db.getAllAsync<TaskStats & { percentage?: number }>(
    `SELECT
       t.id as taskId,
       t.task_name as taskName,
       t.color,
       SUM(COALESCE(te.duration_seconds, 0)) as totalSeconds,
       COUNT(*) as sessionCount
     FROM time_entries te
     JOIN tasks t ON te.task_id = t.id
     WHERE te.date >= ? AND te.date <= ? AND te.duration_seconds IS NOT NULL
     GROUP BY t.id
     ORDER BY totalSeconds DESC`,
    [startDateStr, endDateStr]
  );

  return result.map(stat => ({
    ...stat,
    percentage: totalSeconds > 0 ? (stat.totalSeconds / totalSeconds) * 100 : 0
  }));
};

export const getHourlyStatsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<HourlyStats[]> => {
  const db = await getDatabase();
  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

  const result = await db.getAllAsync<HourlyStats>(
    `SELECT
       CAST(strftime('%H', start_time) AS INTEGER) as hour,
       CAST(strftime('%w', date) AS INTEGER) as dayOfWeek,
       SUM(COALESCE(duration_seconds, 0)) as totalSeconds
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL
     GROUP BY hour, dayOfWeek
     ORDER BY dayOfWeek, hour`,
    [startDateStr, endDateStr]
  );
  return result;
};

export const getSummaryStatsForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<SummaryStats> => {
  const db = await getDatabase();
  const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd');
  const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

  // Total focus time and session count
  const totals = await db.getFirstAsync<{ totalSeconds: number; sessionCount: number }>(
    `SELECT
       SUM(COALESCE(duration_seconds, 0)) as totalSeconds,
       COUNT(*) as sessionCount
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL`,
    [startDateStr, endDateStr]
  );

  // Number of days in range
  const dayCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT date) as count
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL`,
    [startDateStr, endDateStr]
  );

  // Most productive day
  const productiveDay = await db.getFirstAsync<{ date: string; total: number }>(
    `SELECT date, SUM(COALESCE(duration_seconds, 0)) as total
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL
     GROUP BY date
     ORDER BY total DESC
     LIMIT 1`,
    [startDateStr, endDateStr]
  );

  // Most productive hour
  const productiveHour = await db.getFirstAsync<{ hour: number; total: number }>(
    `SELECT
       CAST(strftime('%H', start_time) AS INTEGER) as hour,
       SUM(COALESCE(duration_seconds, 0)) as total
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL
     GROUP BY hour
     ORDER BY total DESC
     LIMIT 1`,
    [startDateStr, endDateStr]
  );

  // Longest session
  const longestSession = await db.getFirstAsync<{ duration: number }>(
    `SELECT MAX(duration_seconds) as duration
     FROM time_entries
     WHERE date >= ? AND date <= ? AND duration_seconds IS NOT NULL`,
    [startDateStr, endDateStr]
  );

  const totalFocusTime = totals?.totalSeconds || 0;
  const days = dayCount?.count || 1;

  return {
    totalFocusTime,
    averageDailyFocusTime: days > 0 ? totalFocusTime / days : 0,
    totalSessions: totals?.sessionCount || 0,
    mostProductiveDay: productiveDay?.date || null,
    mostProductiveHour: productiveHour?.hour ?? null,
    longestSession: longestSession?.duration || 0
  };
};

// ==================== SETTINGS ====================

export const getSettings = async (): Promise<Settings> => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<Settings & { dark_mode?: boolean }>('SELECT * FROM settings WHERE id = 1');
  if (result) {
    // Handle migration: if theme_mode doesn't exist, derive from dark_mode
    const theme_mode = result.theme_mode || (result.dark_mode ? 'dark' : 'system');
    return {
      ...result,
      theme_mode: theme_mode as ThemeMode,
    };
  }
  return {
    id: 1,
    color_palette: 'ocean_breeze',
    language: 'en',
    theme_mode: 'system',
    created_at: new Date().toISOString(),
    updated_at: null
  };
};

export const updateColorPalette = async (palette: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE settings SET color_palette = ?, updated_at = datetime("now") WHERE id = 1',
    [palette]
  );
};

export const updateLanguage = async (language: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE settings SET language = ?, updated_at = datetime("now") WHERE id = 1',
    [language]
  );
};

export const updateThemeMode = async (themeMode: ThemeMode): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE settings SET theme_mode = ?, updated_at = datetime("now") WHERE id = 1',
    [themeMode]
  );
};
