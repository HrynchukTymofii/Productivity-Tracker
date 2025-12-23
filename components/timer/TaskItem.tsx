import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useTimer } from '../../contexts/TimerContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TimerDisplay } from './TimerDisplay';
import { formatDuration } from '../../utils/timeFormatter';
import { Button } from '../ui/Button';
import { getLatestTimeEntryForTask, updateTimeEntryDetails } from '../../database/queries';

interface TaskItemProps {
  task: Task;
  onOpenFullScreen?: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onOpenFullScreen }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    updateTaskName,
    getTodayTotal,
  } = useTimer();

  const [todayTotal, setTodayTotal] = useState(0);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState(task.task_name);
  const [editedHours, setEditedHours] = useState('0');
  const [editedMinutes, setEditedMinutes] = useState('0');
  const [editedNotes, setEditedNotes] = useState('');
  const [latestEntryId, setLatestEntryId] = useState<number | null>(null);
  const [latestNotes, setLatestNotes] = useState<string | null>(null);

  const isActiveTask = timerState.activeTaskId === task.id;
  const isRunning = isActiveTask && timerState.isRunning && !timerState.isPaused;
  const isPaused = isActiveTask && timerState.isPaused;

  useEffect(() => {
    loadTodayTotal();
    loadLatestNotes();
  }, [task.id]);

  // Update today total when timer stops
  useEffect(() => {
    if (!isActiveTask && !timerState.isRunning) {
      loadTodayTotal();
      loadLatestNotes();
    }
  }, [timerState.isRunning, isActiveTask]);

  const loadTodayTotal = async () => {
    const total = await getTodayTotal(task.id);
    setTodayTotal(total);
  };

  const loadLatestNotes = async () => {
    try {
      const latestEntry = await getLatestTimeEntryForTask(task.id);
      if (latestEntry?.notes) {
        setLatestNotes(latestEntry.notes);
      } else {
        setLatestNotes(null);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startTimer(task.id);
  };

  const handlePause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pauseTimer();
  };

  const handleResume = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await resumeTimer();
  };

  const handleStop = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await stopTimer();
    loadTodayTotal();
  };

  const handleEdit = async () => {
    setEditedName(task.task_name);

    // Load the latest time entry if this is not the active task
    if (!isActiveTask) {
      try {
        const latestEntry = await getLatestTimeEntryForTask(task.id);
        if (latestEntry) {
          setLatestEntryId(latestEntry.id);

          // Convert duration to hours and minutes
          const durationSecs = latestEntry.duration_seconds || 0;
          const totalMinutes = Math.floor(durationSecs / 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          setEditedHours(hours.toString());
          setEditedMinutes(minutes.toString());
          setEditedNotes(latestEntry.notes || '');
        } else {
          setLatestEntryId(null);
          setEditedHours('0');
          setEditedMinutes('0');
          setEditedNotes('');
        }
      } catch (error) {
        console.error('Error loading time entry:', error);
      }
    }

    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    // Update task name if changed
    if (editedName.trim() && editedName !== task.task_name) {
      await updateTaskName(task.id, editedName.trim());
    }

    // Update time entry details if this is a completed task
    if (!isActiveTask && latestEntryId) {
      const hours = parseInt(editedHours) || 0;
      const minutes = parseInt(editedMinutes) || 0;
      const totalSeconds = (hours * 3600) + (minutes * 60);

      // Get the original entry to preserve duration if user only edited notes
      const latestEntry = await getLatestTimeEntryForTask(task.id);
      const durationToSave = totalSeconds > 0 ? totalSeconds : (latestEntry?.duration_seconds || 0);

      // Always save if we have an entry (notes or duration changed)
      if (durationToSave > 0 || editedNotes.trim()) {
        await updateTimeEntryDetails(latestEntryId, durationToSave, editedNotes.trim() || null);
        loadTodayTotal();
        loadLatestNotes();
      }
    }

    setIsEditModalVisible(false);
  };

  const renderControls = () => {
    if (!isActiveTask) {
      return (
        <TouchableOpacity
          style={styles.controlButtonOuter}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <View style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.glassOverlay} />
            <Ionicons name="play" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.activeControls}>
        {isPaused ? (
          <TouchableOpacity
            style={styles.controlButtonOuter}
            onPress={handleResume}
            activeOpacity={0.8}
          >
            <View style={[styles.controlButton, { backgroundColor: theme.colors.success }]}>
              <View style={styles.glassOverlay} />
              <Ionicons name="play" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.controlButtonOuter}
            onPress={handlePause}
            activeOpacity={0.8}
          >
            <View style={[styles.controlButton, { backgroundColor: theme.colors.warning }]}>
              <View style={styles.glassOverlay} />
              <Ionicons name="pause" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.controlButtonOuter}
          onPress={handleStop}
          activeOpacity={0.8}
        >
          <View style={[styles.controlButton, { backgroundColor: theme.colors.error }]}>
            <View style={styles.glassOverlay} />
            <Ionicons name="stop" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.card,
            borderLeftColor: task.color,
            borderColor: isActiveTask ? task.color : theme.colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.taskInfo}>
            <View style={[styles.colorDot, { backgroundColor: task.color }]} />
            <TouchableOpacity onPress={handleEdit} style={styles.taskNameContainer}>
              <Text style={[styles.taskName, { color: theme.colors.text }]}>
                {task.task_name}
              </Text>
              <Ionicons
                name="pencil"
                size={14}
                color={theme.colors.placeholder}
                style={styles.editIcon}
              />
            </TouchableOpacity>
          </View>
          {renderControls()}
        </View>

        {latestNotes && (
          <Text style={[styles.taskNotes, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {latestNotes}
          </Text>
        )}

        {isActiveTask && (
          <View style={styles.timerSection}>
            <TimerDisplay
              seconds={timerState.elapsedSeconds}
              size="medium"
              isPaused={isPaused}
            />
            {isPaused && (
              <Text style={[styles.pausedText, { color: theme.colors.warning }]}>
                {t('fullScreenTimer.paused')}
              </Text>
            )}
            {onOpenFullScreen && (
              <TouchableOpacity
                style={[
                  styles.fullScreenButton,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onPress={onOpenFullScreen}
              >
                <Ionicons name="expand" size={18} color={theme.colors.primary} />
                <Text style={[styles.fullScreenText, { color: theme.colors.primary }]}>
                  {t('timer.openFullScreen')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={[styles.todayLabel, { color: theme.colors.textSecondary }]}>
            {t('timer.totalToday')}:
          </Text>
          <Text style={[styles.todayTime, { color: theme.colors.text }]}>
            {formatDuration(todayTotal + (isActiveTask ? timerState.elapsedSeconds : 0))}
          </Text>
        </View>
      </View>

      {/* Edit Task Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {isActiveTask ? t('timer.editTask') : t('timer.editTaskAndTime')}
              </Text>

              {/* Task Name Input */}
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                {t('timer.taskName')}
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={editedName}
                onChangeText={setEditedName}
                placeholder={t('timer.taskName')}
                placeholderTextColor={theme.colors.placeholder}
                autoFocus
              />

              {/* Time Inputs - Only for completed tasks */}
              {!isActiveTask && (
                <>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                    {t('timer.duration')}
                  </Text>
                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputContainer}>
                      <TextInput
                        style={[
                          styles.timeInput,
                          {
                            backgroundColor: theme.colors.surfaceVariant,
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        value={editedHours}
                        onChangeText={setEditedHours}
                        placeholder="0"
                        placeholderTextColor={theme.colors.placeholder}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                      <Text style={[styles.timeInputLabel, { color: theme.colors.textSecondary }]}>
                        {t('timer.hours')}
                      </Text>
                    </View>

                    <Text style={[styles.timeSeparator, { color: theme.colors.text }]}>:</Text>

                    <View style={styles.timeInputContainer}>
                      <TextInput
                        style={[
                          styles.timeInput,
                          {
                            backgroundColor: theme.colors.surfaceVariant,
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        value={editedMinutes}
                        onChangeText={setEditedMinutes}
                        placeholder="0"
                        placeholderTextColor={theme.colors.placeholder}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                      <Text style={[styles.timeInputLabel, { color: theme.colors.textSecondary }]}>
                        {t('timer.minutes')}
                      </Text>
                    </View>
                  </View>

                  {/* Notes Input */}
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                    {t('timer.notes')}
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      styles.notesInput,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={editedNotes}
                    onChangeText={setEditedNotes}
                    placeholder={t('timer.addNotes')}
                    placeholderTextColor={theme.colors.placeholder}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title={t('common.save')}
                onPress={handleSaveEdit}
                disabled={!editedName.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  taskNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: 6,
  },
  taskNotes: {
    fontSize: 13,
    marginTop: 6,
    marginLeft: 20,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  controlButtonOuter: {
    borderRadius: 19,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginLeft: 6,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
  },
  activeControls: {
    flexDirection: 'row',
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 16,
  },
  pausedText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  fullScreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  fullScreenText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  todayLabel: {
    fontSize: 12,
  },
  todayTime: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    minWidth: 100,
    marginLeft: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeInputContainer: {
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
  timeInputLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
});
