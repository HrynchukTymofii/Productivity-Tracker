import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTimer } from '../../contexts/TimerContext';
import { TimeEntryWithTask, PlannerSlot } from '../../types';
import { getTimeEntriesForDate } from '../../database/queries';
import { formatDuration, formatTimeOfDay } from '../../utils/timeFormatter';
import { getHourLabels, checkIsToday, getMinutesFromMidnight } from '../../utils/dateHelpers';
import { EmptyState } from '../ui/EmptyState';

const HOUR_HEIGHT = 60;
const TIMELINE_WIDTH = 60;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DayPlannerProps {
  selectedDate: Date;
}

export const DayPlanner: React.FC<DayPlannerProps> = ({ selectedDate }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { timerState, activeTask } = useTimer();
  const scrollViewRef = useRef<ScrollView>(null);

  const [entries, setEntries] = useState<TimeEntryWithTask[]>([]);
  const [slots, setSlots] = useState<PlannerSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PlannerSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isToday = checkIsToday(selectedDate);

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  // Refresh entries when timer state changes
  useEffect(() => {
    if (!timerState.isRunning) {
      loadEntries();
    }
  }, [timerState.isRunning]);

  useEffect(() => {
    // Scroll to current time or first entry
    if (isToday) {
      const currentHour = new Date().getHours();
      const scrollPosition = Math.max(0, (currentHour - 1) * HOUR_HEIGHT);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
      }, 100);
    } else if (slots.length > 0) {
      const firstSlotHour = slots[0].startTime.getHours();
      const scrollPosition = Math.max(0, (firstSlotHour - 1) * HOUR_HEIGHT);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
      }, 100);
    }
  }, [isToday, slots]);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const data = await getTimeEntriesForDate(selectedDate);
      setEntries(data);
      processSlots(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processSlots = (data: TimeEntryWithTask[]) => {
    const processedSlots: PlannerSlot[] = data.map(entry => {
      const startTime = new Date(entry.start_time);
      const endTime = entry.end_time
        ? new Date(entry.end_time)
        : entry.is_paused
        ? new Date(entry.paused_at!)
        : new Date(); // Active timer

      const durationSeconds =
        entry.duration_seconds ||
        entry.accumulated_seconds +
          (entry.is_paused
            ? 0
            : Math.floor((new Date().getTime() - startTime.getTime()) / 1000));

      return {
        id: entry.id,
        taskId: entry.task_id,
        taskName: entry.task_name,
        color: entry.color,
        startTime,
        endTime,
        durationMinutes: Math.ceil(durationSeconds / 60),
        isActive: !entry.end_time && !entry.is_paused,
        isPaused: entry.is_paused,
      };
    });

    setSlots(processedSlots);
  };

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const now = new Date();
    const minutes = getMinutesFromMidnight(now);
    return (minutes / 60) * HOUR_HEIGHT;
  };

  const getSlotPosition = (slot: PlannerSlot) => {
    const minutes = getMinutesFromMidnight(slot.startTime);
    return (minutes / 60) * HOUR_HEIGHT;
  };

  const getSlotHeight = (slot: PlannerSlot) => {
    // Minimum height of 30 minutes equivalent
    const minHeight = 30;
    const height = Math.max(minHeight, (slot.durationMinutes / 60) * HOUR_HEIGHT);
    return height;
  };

  const handleSlotPress = (slot: PlannerSlot) => {
    setSelectedSlot(slot);
  };

  const renderTimeLabels = () => {
    const hours = getHourLabels();
    return (
      <View style={styles.timeLabels}>
        {hours.map((hour, index) => (
          <View key={index} style={[styles.timeLabel, { height: HOUR_HEIGHT }]}>
            <Text style={[styles.timeLabelText, { color: theme.colors.textSecondary }]}>
              {hour}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGridLines = () => {
    return (
      <View style={styles.gridLines}>
        {Array.from({ length: 24 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.gridLine,
              {
                height: HOUR_HEIGHT,
                borderBottomColor: theme.colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderCurrentTimeLine = () => {
    const position = getCurrentTimePosition();
    if (position === null) return null;

    return (
      <View
        style={[
          styles.currentTimeLine,
          {
            top: position,
            backgroundColor: theme.colors.error,
          },
        ]}
      >
        <View
          style={[
            styles.currentTimeDot,
            { backgroundColor: theme.colors.error },
          ]}
        />
      </View>
    );
  };

  const renderSlots = () => {
    return slots.map(slot => {
      const top = getSlotPosition(slot);
      const height = getSlotHeight(slot);

      return (
        <TouchableOpacity
          key={slot.id}
          style={[
            styles.slot,
            {
              top,
              height,
              backgroundColor: slot.color,
              borderLeftColor: slot.color,
              opacity: slot.isActive ? 1 : 0.85,
            },
          ]}
          onPress={() => handleSlotPress(slot)}
          activeOpacity={0.8}
        >
          <View style={styles.slotContent}>
            <Text style={styles.slotTaskName} numberOfLines={1}>
              {slot.taskName}
            </Text>
            <Text style={styles.slotDuration}>
              {formatDuration(slot.durationMinutes * 60)}
            </Text>
            {(slot.isActive || slot.isPaused) && (
              <View style={styles.slotStatus}>
                <Ionicons
                  name={slot.isActive ? 'play-circle' : 'pause-circle'}
                  size={14}
                  color="#FFF"
                />
                <Text style={styles.slotStatusText}>
                  {slot.isActive ? t('planner.active') : t('planner.paused')}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  };

  // Add active timer slot if currently tracking and is today
  const renderActiveTimerSlot = () => {
    if (!isToday || !timerState.isRunning || !activeTask) return null;

    // Check if already in slots (from database)
    const existsInSlots = slots.some(
      s => s.taskId === activeTask.id && (s.isActive || s.isPaused)
    );
    if (existsInSlots) return null;

    const now = new Date();
    const startTime = timerState.startTime || now;
    const durationMinutes = Math.ceil(timerState.elapsedSeconds / 60);

    const slot: PlannerSlot = {
      id: -1,
      taskId: activeTask.id,
      taskName: activeTask.task_name,
      color: activeTask.color,
      startTime,
      endTime: now,
      durationMinutes,
      isActive: !timerState.isPaused,
      isPaused: timerState.isPaused,
    };

    const top = getSlotPosition(slot);
    const height = getSlotHeight(slot);

    return (
      <View
        style={[
          styles.slot,
          {
            top,
            height,
            backgroundColor: slot.color,
            borderLeftColor: slot.color,
          },
        ]}
      >
        <View style={styles.slotContent}>
          <Text style={styles.slotTaskName} numberOfLines={1}>
            {slot.taskName}
          </Text>
          <Text style={styles.slotDuration}>
            {formatDuration(timerState.elapsedSeconds)}
          </Text>
          <View style={styles.slotStatus}>
            <Ionicons
              name={slot.isActive ? 'play-circle' : 'pause-circle'}
              size={14}
              color="#FFF"
            />
            <Text style={styles.slotStatusText}>
              {slot.isActive ? t('planner.active') : t('planner.paused')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textSecondary }}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (slots.length === 0 && !(isToday && timerState.isRunning)) {
    return (
      <EmptyState
        icon="calendar-outline"
        title={t('planner.noEntries')}
        subtitle={t('planner.startTracking')}
      />
    );
  }

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.plannerContent}>
          {renderTimeLabels()}
          <View style={[styles.slotsContainer, { width: SCREEN_WIDTH - TIMELINE_WIDTH - 32 }]}>
            {renderGridLines()}
            {renderSlots()}
            {renderActiveTimerSlot()}
            {renderCurrentTimeLine()}
          </View>
        </View>
      </ScrollView>

      {/* Slot Detail Modal */}
      <Modal
        visible={!!selectedSlot}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedSlot(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedSlot(null)}
        >
          {selectedSlot && (
            <View
              style={[
                styles.slotDetailModal,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <View
                style={[
                  styles.slotDetailHeader,
                  { backgroundColor: selectedSlot.color },
                ]}
              >
                <Text style={styles.slotDetailTaskName}>{selectedSlot.taskName}</Text>
              </View>
              <View style={styles.slotDetailContent}>
                <View style={styles.slotDetailRow}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.slotDetailText, { color: theme.colors.text }]}
                  >
                    {formatTimeOfDay(selectedSlot.startTime)} -{' '}
                    {formatTimeOfDay(selectedSlot.endTime)}
                  </Text>
                </View>
                <View style={styles.slotDetailRow}>
                  <Ionicons
                    name="hourglass-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.slotDetailText, { color: theme.colors.text }]}
                  >
                    {formatDuration(selectedSlot.durationMinutes * 60)}
                  </Text>
                </View>
                <View style={styles.slotDetailRow}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[styles.slotDetailText, { color: theme.colors.text }]}
                  >
                    {selectedSlot.isActive
                      ? t('planner.active')
                      : selectedSlot.isPaused
                      ? t('planner.paused')
                      : t('planner.completed')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plannerContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeLabels: {
    width: TIMELINE_WIDTH,
  },
  timeLabel: {
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  slotsContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  gridLine: {
    borderBottomWidth: 1,
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 100,
  },
  currentTimeDot: {
    position: 'absolute',
    left: -4,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  slot: {
    position: 'absolute',
    left: 0,
    right: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 8,
    overflow: 'hidden',
    zIndex: 10,
  },
  slotContent: {
    flex: 1,
  },
  slotTaskName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  slotDuration: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 2,
  },
  slotStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  slotStatusText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  slotDetailModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
  },
  slotDetailHeader: {
    padding: 16,
  },
  slotDetailTaskName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  slotDetailContent: {
    padding: 16,
  },
  slotDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotDetailText: {
    fontSize: 15,
    marginLeft: 12,
  },
});
