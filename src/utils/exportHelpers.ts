import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { format } from 'date-fns';
import { ExportData, TimeEntryWithTask, TaskStats, SummaryStats, DateRange } from '../types';
import { formatDuration, formatTime } from './timeFormatter';

/**
 * Generate filename with date range
 */
const generateFilename = (prefix: string, dateRange: DateRange, extension: string): string => {
  const startStr = format(dateRange.startDate, 'yyyy-MM-dd');
  const endStr = format(dateRange.endDate, 'yyyy-MM-dd');
  return `${prefix}_${startStr}_to_${endStr}.${extension}`;
};

/**
 * Export data to CSV
 */
export const exportToCSV = async (data: ExportData): Promise<string> => {
  const { dateRange, entries } = data;

  // CSV Headers
  const headers = ['Date', 'Task Name', 'Start Time', 'End Time', 'Duration (minutes)', 'Status'];

  // CSV Rows
  const rows = entries.map(entry => {
    const startTime = new Date(entry.start_time);
    const endTime = entry.end_time ? new Date(entry.end_time) : null;
    const duration = entry.duration_seconds
      ? Math.round(entry.duration_seconds / 60)
      : Math.round(entry.accumulated_seconds / 60);
    const status = entry.end_time ? 'Completed' : entry.is_paused ? 'Paused' : 'Active';

    return [
      format(startTime, 'yyyy-MM-dd'),
      `"${entry.task_name.replace(/"/g, '""')}"`,
      format(startTime, 'HH:mm:ss'),
      endTime ? format(endTime, 'HH:mm:ss') : '',
      duration.toString(),
      status
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Save to file
  const filename = generateFilename('TimeTracker_Data', dateRange, 'csv');
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8
  });

  return fileUri;
};

/**
 * Generate HTML for PDF export
 */
const generatePDFHTML = (data: ExportData): string => {
  const { dateRange, entries, taskStats, summaryStats } = data;

  const dateRangeStr = `${format(dateRange.startDate, 'MMMM d, yyyy')} - ${format(
    dateRange.endDate,
    'MMMM d, yyyy'
  )}`;

  const taskStatsHTML = taskStats
    .map(
      stat => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${
              stat.color
            }; border-radius: 2px; margin-right: 8px;"></span>
            ${stat.taskName}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatDuration(
            stat.totalSeconds
          )}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${
            stat.sessionCount
          }</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${stat.percentage.toFixed(
            1
          )}%</td>
        </tr>
      `
    )
    .join('');

  const entriesHTML = entries
    .slice(0, 50) // Limit to 50 entries in PDF
    .map(entry => {
      const startTime = new Date(entry.start_time);
      const endTime = entry.end_time ? new Date(entry.end_time) : null;
      const duration = entry.duration_seconds || entry.accumulated_seconds;
      const status = entry.end_time ? 'Completed' : entry.is_paused ? 'Paused' : 'Active';

      return `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">${format(
            startTime,
            'MMM d'
          )}</td>
          <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: ${
              entry.color
            }; border-radius: 2px; margin-right: 4px;"></span>
            ${entry.task_name}
          </td>
          <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">${format(
            startTime,
            'HH:mm'
          )}</td>
          <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">${
            endTime ? format(endTime, 'HH:mm') : '-'
          }</td>
          <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">${formatDuration(
            duration
          )}</td>
          <td style="padding: 6px; border-bottom: 1px solid #eee; font-size: 11px;">${status}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Time Tracking Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 40px;
          color: #333;
          line-height: 1.5;
        }
        h1 {
          color: #1a1a1a;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h2 {
          color: #2c3e50;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        .date-range {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #3498db;
        }
        .summary-card .label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background: #f8f9fa;
          padding: 10px 8px;
          text-align: left;
          font-size: 12px;
          color: #666;
          border-bottom: 2px solid #eee;
        }
        .generated-date {
          margin-top: 40px;
          font-size: 11px;
          color: #999;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>Time Tracking Report</h1>
      <p class="date-range">${dateRangeStr}</p>

      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${formatDuration(summaryStats.totalFocusTime)}</div>
          <div class="label">Total Focus Time</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatDuration(Math.round(summaryStats.averageDailyFocusTime))}</div>
          <div class="label">Daily Average</div>
        </div>
        <div class="summary-card">
          <div class="value">${summaryStats.totalSessions}</div>
          <div class="label">Total Sessions</div>
        </div>
        <div class="summary-card">
          <div class="value">${
            summaryStats.mostProductiveDay
              ? format(new Date(summaryStats.mostProductiveDay), 'EEE')
              : '-'
          }</div>
          <div class="label">Most Productive Day</div>
        </div>
        <div class="summary-card">
          <div class="value">${
            summaryStats.mostProductiveHour !== null
              ? `${summaryStats.mostProductiveHour}:00`
              : '-'
          }</div>
          <div class="label">Most Productive Hour</div>
        </div>
        <div class="summary-card">
          <div class="value">${formatDuration(summaryStats.longestSession)}</div>
          <div class="label">Longest Session</div>
        </div>
      </div>

      <h2>Task Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th style="text-align: right;">Total Time</th>
            <th style="text-align: right;">Sessions</th>
            <th style="text-align: right;">Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${taskStatsHTML}
        </tbody>
      </table>

      <h2>Time Entries ${entries.length > 50 ? '(First 50)' : ''}</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Task</th>
            <th>Start</th>
            <th>End</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${entriesHTML}
        </tbody>
      </table>

      <p class="generated-date">Generated on ${format(new Date(), 'MMMM d, yyyy HH:mm')}</p>
    </body>
    </html>
  `;
};

/**
 * Export data to PDF
 */
export const exportToPDF = async (data: ExportData): Promise<string> => {
  const { dateRange } = data;

  const html = generatePDFHTML(data);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false
  });

  // Move to documents directory with proper filename
  const filename = generateFilename('TimeTracker_Report', dateRange, 'pdf');
  const newUri = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.moveAsync({
    from: uri,
    to: newUri
  });

  return newUri;
};

/**
 * Share a file using native share sheet
 */
export const shareFile = async (fileUri: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(fileUri, {
      mimeType: fileUri.endsWith('.pdf') ? 'application/pdf' : 'text/csv',
      dialogTitle: 'Export Time Tracking Data'
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};

/**
 * Export and share CSV
 */
export const exportAndShareCSV = async (data: ExportData): Promise<void> => {
  const fileUri = await exportToCSV(data);
  await shareFile(fileUri);
};

/**
 * Export and share PDF
 */
export const exportAndSharePDF = async (data: ExportData): Promise<void> => {
  const fileUri = await exportToPDF(data);
  await shareFile(fileUri);
};
