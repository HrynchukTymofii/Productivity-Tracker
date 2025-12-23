import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loading } from '../../components/ui/Loading';
import {
  getDailyStatsForDateRange,
  getTaskStatsForDateRange,
  getHourlyStatsForDateRange,
  getSummaryStatsForDateRange,
  getTimeEntriesForDateRange,
} from '../../database/queries';
import {
  DailyStats,
  TaskStats,
  HourlyStats,
  SummaryStats,
  DateRange,
  ExportData,
} from '../../types';
import {
  getWeekRange,
  getMonthRange,
  formatDateRange,
  getWeekDayNames,
  formatCompactDate,
  getMondayBasedDayOfWeek,
} from '../../utils/dateHelpers';
import { formatDuration, formatHours, secondsToHours } from '../../utils/timeFormatter';
import { exportAndSharePDF, exportAndShareCSV } from '../../utils/exportHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

type PeriodType = 'week' | 'month' | 'custom';

export default function StatisticsScreen () {
  const { theme, currentPalette } = useTheme();
  const { t } = useLanguage();

  const [period, setPeriod] = useState<PeriodType>('week');
  const [dateRange, setDateRange] = useState<DateRange>(getWeekRange());
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);

  // Refresh statistics when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [dateRange])
  );

  useEffect(() => {
    if (period === 'week') {
      setDateRange(getWeekRange());
    } else if (period === 'month') {
      setDateRange(getMonthRange());
    }
  }, [period]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const [daily, tasks, hourly, summary] = await Promise.all([
        getDailyStatsForDateRange(dateRange.startDate, dateRange.endDate),
        getTaskStatsForDateRange(dateRange.startDate, dateRange.endDate),
        getHourlyStatsForDateRange(dateRange.startDate, dateRange.endDate),
        getSummaryStatsForDateRange(dateRange.startDate, dateRange.endDate),
      ]);

      setDailyStats(daily);
      setTaskStats(tasks);
      setHourlyStats(hourly);
      setSummaryStats(summary);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (type: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      const entries = await getTimeEntriesForDateRange(
        dateRange.startDate,
        dateRange.endDate
      );

      const exportData: ExportData = {
        dateRange,
        entries,
        taskStats,
        dailyStats,
        summaryStats: summaryStats!,
      };

      if (type === 'pdf') {
        await exportAndSharePDF(exportData);
      } else {
        await exportAndShareCSV(exportData);
      }

      Toast.show({
        type: 'success',
        text1: t('statistics.exportSuccess'),
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: t('statistics.exportError'),
        visibilityTime: 2000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare bar chart data (in hours or minutes based on max value)
  const barChartData = useMemo(() => {
    const dayNames = getWeekDayNames();
    const labels = period === 'week' ? dayNames : dailyStats.map(d => formatCompactDate(new Date(d.date)));

    // First calculate in minutes to determine scale
    const dataInMinutes = period === 'week'
      ? dayNames.map((_, i) => {
          const dayData = dailyStats.find(
            d => getMondayBasedDayOfWeek(new Date(d.date)) === i
          );
          return dayData ? Math.round(dayData.totalSeconds / 60) : 0;
        })
      : dailyStats.map(d => Math.round(d.totalSeconds / 60));

    const maxMinutes = Math.max(...dataInMinutes, 60);
    const useHours = maxMinutes > 60;

    // Convert to appropriate unit
    const data = useHours
      ? dataInMinutes.map(m => parseFloat((m / 60).toFixed(1))) // Convert to hours with 1 decimal
      : dataInMinutes;

    const maxValue = useHours ? Math.ceil(maxMinutes / 60) : maxMinutes;

    return {
      labels: labels.slice(0, 7),
      datasets: [{ data: data.length > 0 ? data.slice(0, 7) : [useHours ? 1 : 60] }],
      maxValue,
      useHours,
    };
  }, [dailyStats, period]);

  // Prepare pie chart data with palette colors
  const pieChartData = useMemo(() => {
    return taskStats.slice(0, 6).map((stat, index) => ({
      name: stat.taskName.length > 10 ? stat.taskName.substring(0, 10) + '...' : stat.taskName,
      population: stat.totalSeconds,
      color: stat.color || currentPalette.colors[index % currentPalette.colors.length],
      legendFontColor: theme.colors.text,
      legendFontSize: 11,
    }));
  }, [taskStats, currentPalette, theme]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    const grid: number[][] = Array(7)
      .fill(null)
      .map(() => Array(24).fill(0));

    hourlyStats.forEach(stat => {
      const dayIndex = stat.dayOfWeek === 0 ? 6 : stat.dayOfWeek - 1;
      if (grid[dayIndex] && stat.hour >= 0 && stat.hour < 24) {
        grid[dayIndex][stat.hour] = stat.totalSeconds;
      }
    });

    return grid;
  }, [hourlyStats]);

  const chartConfig = {
    backgroundColor: theme.colors.card,
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: barChartData.useHours ? 1 : 0, // 1 decimal for hours, 0 for minutes
    color: (opacity = 1) => {
      // Use primary color from current palette
      const hex = theme.colors.primary.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: (opacity = 1) =>
      theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
    },
  };

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: theme.colors.card }]}>
      {(['week', 'month'] as PeriodType[]).map(p => (
        <TouchableOpacity
          key={p}
          style={[
            styles.periodButton,
            period === p && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setPeriod(p)}
        >
          <Text
            style={[
              styles.periodButtonText,
              { color: period === p ? '#FFF' : theme.colors.text },
            ]}
          >
            {p === 'week' ? t('statistics.thisWeek') : t('statistics.thisMonth')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => {
    if (!summaryStats) return null;

    const cards = [
      {
        icon: 'time-outline',
        label: t('statistics.totalFocusTime'),
        value: formatDuration(summaryStats.totalFocusTime),
      },
      {
        icon: 'trending-up-outline',
        label: t('statistics.averageDaily'),
        value: formatDuration(Math.round(summaryStats.averageDailyFocusTime)),
      },
      {
        icon: 'layers-outline',
        label: t('statistics.totalSessions'),
        value: summaryStats.totalSessions.toString(),
      },
      {
        icon: 'trophy-outline',
        label: t('statistics.longestSession'),
        value: formatDuration(summaryStats.longestSession),
      },
    ];

    return (
      <View style={styles.summaryGrid}>
        {cards.map((card, index) => (
          <Card key={index} style={styles.summaryCard}>
            <Ionicons
              name={card.icon as any}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {card.value}
            </Text>
            <Text
              style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}
            >
              {card.label}
            </Text>
          </Card>
        ))}
      </View>
    );
  };

  // Format minutes for display
  const formatMinutesDisplay = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderBarChart = () => {
    if (dailyStats.length === 0) return null;

    return (
      <Card style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          {t('statistics.dailyFocusTime')}
        </Text>
        <BarChart
          data={barChartData}
          width={CHART_WIDTH}
          height={220}
          yAxisLabel=""
          yAxisSuffix={barChartData.useHours ? "h" : "m"}
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero={false}
          showValuesOnTopOfBars={false}
          withInnerLines={true}
          segments={4}
        />
      </Card>
    );
  };

  const renderPieChart = () => {
    if (taskStats.length === 0) return null;

    return (
      <Card style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          {t('statistics.taskDistribution')}
        </Text>
        <PieChart
          data={pieChartData}
          width={CHART_WIDTH}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </Card>
    );
  };

  const renderHeatmap = () => {
    const maxValue = Math.max(...heatmapData.flat(), 1);
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    // Convert primary color to RGB for heatmap
    const primaryHex = theme.colors.primary.replace('#', '');
    const r = parseInt(primaryHex.substring(0, 2), 16);
    const g = parseInt(primaryHex.substring(2, 4), 16);
    const b = parseInt(primaryHex.substring(4, 6), 16);

    return (
      <Card style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          {t('statistics.productivityHeatmap')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.heatmapHeader}>
              <View style={styles.heatmapDayLabel} />
              {Array.from({ length: 24 }).map((_, hour) => (
                <Text
                  key={hour}
                  style={[
                    styles.heatmapHourLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {hour % 6 === 0 ? `${hour}` : ''}
                </Text>
              ))}
            </View>
            {heatmapData.map((row, dayIndex) => (
              <View key={dayIndex} style={styles.heatmapRow}>
                <Text
                  style={[
                    styles.heatmapDayLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {dayLabels[dayIndex]}
                </Text>
                {row.map((value, hourIndex) => {
                  const intensity = value / maxValue;
                  return (
                    <View
                      key={hourIndex}
                      style={[
                        styles.heatmapCell,
                        {
                          backgroundColor:
                            intensity > 0
                              ? `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`
                              : theme.colors.surfaceVariant,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </Card>
    );
  };

  const renderTaskBreakdown = () => {
    if (taskStats.length === 0) return null;

    return (
      <Card style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          {t('statistics.taskBreakdown')}
        </Text>
        {taskStats.map((stat, index) => (
          <View
            key={stat.taskId}
            style={[
              styles.taskRow,
              index < taskStats.length - 1 && {
                borderBottomColor: theme.colors.border,
                borderBottomWidth: 1,
              },
            ]}
          >
            <View style={styles.taskInfo}>
              <View
                style={[styles.taskColorDot, { backgroundColor: stat.color }]}
              />
              <Text
                style={[styles.taskName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {stat.taskName}
              </Text>
            </View>
            <View style={styles.taskStats}>
              <Text style={[styles.taskTime, { color: theme.colors.text }]}>
                {formatDuration(stat.totalSeconds)}
              </Text>
              <Text
                style={[
                  styles.taskPercentage,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {stat.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </Card>
    );
  };

  const renderExportButtons = () => (
    <View style={styles.exportButtons}>
      <TouchableOpacity
        style={styles.exportButtonOuter}
        onPress={() => handleExport('pdf')}
        activeOpacity={0.8}
        disabled={isExporting || taskStats.length === 0}
      >
        <LinearGradient
          colors={taskStats.length === 0 ? ['#ccc', '#aaa', '#999'] : ['#ff6b6b', '#ee5a5a', '#c0392b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.exportButtonGradient}
        >
          <View style={styles.exportButtonGlass} />
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color="#FFF" />
              <Text style={styles.exportButtonText}>{t('statistics.exportPDF')}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.exportButtonOuter}
        onPress={() => handleExport('csv')}
        activeOpacity={0.8}
        disabled={isExporting || taskStats.length === 0}
      >
        <LinearGradient
          colors={taskStats.length === 0 ? ['#ccc', '#aaa', '#999'] : ['#5cd85c', '#2ecc71', '#27ae60']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.exportButtonGradient}
        >
          <View style={styles.exportButtonGlass} />
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#FFF" />
              <Text style={styles.exportButtonText}>{t('statistics.exportCSV')}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <Loading fullScreen message={t('common.loading')} />;
  }

  const hasData = taskStats.length > 0 || dailyStats.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['top']}
    >
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('statistics.title')}
          </Text>
          <Text style={[styles.dateRangeText, { color: theme.colors.textSecondary }]}>
            {formatDateRange(dateRange.startDate, dateRange.endDate)}
          </Text>
        </View>

        {renderPeriodSelector()}

        {!hasData ? (
          <EmptyState
            icon="bar-chart-outline"
            title={t('statistics.noData')}
            subtitle={t('statistics.startTrackingToSee')}
          />
        ) : (
          <>
            {renderExportButtons()}
            {renderSummaryCards()}
            {renderBarChart()}
            {renderPieChart()}
            {renderHeatmap()}
            {renderTaskBreakdown()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  dateRangeText: {
    fontSize: 14,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  exportButtonOuter: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportButtonGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  chartDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  chartDetailItem: {
    width: '14%',
    alignItems: 'center',
  },
  chartDetailDay: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartDetailTime: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  heatmapHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heatmapDayLabel: {
    width: 20,
    fontSize: 11,
    fontWeight: '500',
  },
  heatmapHourLabel: {
    width: 12,
    fontSize: 9,
    textAlign: 'center',
    marginHorizontal: 1,
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskName: {
    fontSize: 14,
    flex: 1,
  },
  taskStats: {
    alignItems: 'flex-end',
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
});

