/**
 * Format seconds to HH:MM:SS string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to human readable duration (e.g., "2h 30min")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${hours}h`;
  }

  return `${minutes}min`;
};

/**
 * Format seconds to short duration (e.g., "2:30")
 */
export const formatShortDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  return `${minutes}min`;
};

/**
 * Format seconds to hours with one decimal (e.g., "2.5h")
 */
export const formatHours = (seconds: number): string => {
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
};

/**
 * Convert seconds to minutes
 */
export const secondsToMinutes = (seconds: number): number => {
  return Math.round(seconds / 60);
};

/**
 * Convert seconds to hours
 */
export const secondsToHours = (seconds: number): number => {
  return seconds / 3600;
};

/**
 * Format time for display based on locale (HH:MM format)
 */
export const formatTimeOfDay = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Parse ISO date string to Date
 */
export const parseISODate = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Calculate duration between two dates in seconds
 */
export const calculateDuration = (startTime: Date, endTime: Date): number => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
};
