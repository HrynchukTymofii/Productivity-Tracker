import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  isToday,
  isYesterday,
  isSameDay,
  parseISO,
  getDay,
  getDaysInMonth,
  eachDayOfInterval
} from 'date-fns';

/**
 * Format date for display (e.g., "Mon, Dec 16")
 */
export const formatDisplayDate = (date: Date): string => {
  return format(date, 'EEE, MMM d');
};

/**
 * Format date for full display (e.g., "Monday, December 16, 2024")
 */
export const formatFullDate = (date: Date): string => {
  return format(date, 'EEEE, MMMM d, yyyy');
};

/**
 * Format date for compact display (e.g., "Dec 16")
 */
export const formatCompactDate = (date: Date): string => {
  return format(date, 'MMM d');
};

/**
 * Format date for SQL (e.g., "2024-12-16")
 */
export const formatSQLDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get relative date label (Today, Yesterday, or formatted date)
 */
export const getRelativeDateLabel = (date: Date): string => {
  if (isToday(date)) {
    return 'today';
  }
  if (isYesterday(date)) {
    return 'yesterday';
  }
  return formatDisplayDate(date);
};

/**
 * Get week date range
 */
export const getWeekRange = (date: Date = new Date()): { start: Date; end: Date } => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday start
    end: endOfWeek(date, { weekStartsOn: 1 })
  };
};

/**
 * Get month date range
 */
export const getMonthRange = (date: Date = new Date()): { start: Date; end: Date } => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
};

/**
 * Get next day
 */
export const getNextDay = (date: Date): Date => {
  return addDays(date, 1);
};

/**
 * Get previous day
 */
export const getPreviousDay = (date: Date): Date => {
  return subDays(date, 1);
};

/**
 * Check if two dates are the same day
 */
export const areSameDay = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

/**
 * Parse ISO string to Date
 */
export const parseDateString = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Get day of week (0 = Sunday, 1 = Monday, etc.)
 */
export const getDayOfWeek = (date: Date): number => {
  return getDay(date);
};

/**
 * Get day of week starting from Monday (0 = Monday, 6 = Sunday)
 */
export const getMondayBasedDayOfWeek = (date: Date): number => {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
};

/**
 * Get number of days in a month
 */
export const getDaysInMonthCount = (date: Date): number => {
  return getDaysInMonth(date);
};

/**
 * Get all days in a date range
 */
export const getAllDaysInRange = (start: Date, end: Date): Date[] => {
  return eachDayOfInterval({ start, end });
};

/**
 * Format hour for display (e.g., "09:00")
 */
export const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

/**
 * Get array of hour labels (00:00 - 23:00)
 */
export const getHourLabels = (): string[] => {
  return Array.from({ length: 24 }, (_, i) => formatHour(i));
};

/**
 * Format date range for display (e.g., "Dec 16 - Dec 22, 2024")
 */
export const formatDateRange = (start: Date, end: Date): string => {
  const startStr = format(start, 'MMM d');
  const endStr = format(end, 'MMM d, yyyy');
  return `${startStr} - ${endStr}`;
};

/**
 * Get week day names (short)
 */
export const getWeekDayNames = (): string[] => {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
};

/**
 * Check if date is today
 */
export const checkIsToday = (date: Date): boolean => {
  return isToday(date);
};

/**
 * Get current time as a fraction of the day (0-1)
 */
export const getCurrentDayProgress = (): number => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return (hours * 60 + minutes) / (24 * 60);
};

/**
 * Calculate minutes from midnight
 */
export const getMinutesFromMidnight = (date: Date): number => {
  return date.getHours() * 60 + date.getMinutes();
};
