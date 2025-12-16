import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useTimer } from '../../contexts/TimerContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TimerDisplay } from './TimerDisplay';
import { formatDuration } from '../../utils/timeFormatter';
import { Button } from '../ui/Button';

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

  const isActiveTask = timerState.activeTaskId === task.id;
  const isRunning = isActiveTask && timerState.isRunning && !timerState.isPaused;
  const isPaused = isActiveTask && timerState.isPaused;

  useEffect(() => {
    loadTodayTotal();
  }, [task.id]);

  // Update today total when timer stops
  useEffect(() => {
    if (!isActiveTask && !timerState.isRunning) {
      loadTodayTotal();
    }
  }, [timerState.isRunning, isActiveTask]);

  const loadTodayTotal = async () => {
    const total = await getTodayTotal(task.id);
    setTodayTotal(total);
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

  const handleEdit = () => {
    setEditedName(task.task_name);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (editedName.trim() && editedName !== task.task_name) {
      await updateTaskName(task.id, editedName.trim());
    }
    setIsEditModalVisible(false);
  };

  const renderControls = () => {
    if (!isActiveTask) {
      return (
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleStart}
        >
          <Ionicons name="play" size={20} color="#FFF" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.activeControls}>
        {isPaused ? (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.success }]}
            onPress={handleResume}
          >
            <Ionicons name="play" size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.warning }]}
            onPress={handlePause}
          >
            <Ionicons name="pause" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.error }]}
          onPress={handleStop}
        >
          <Ionicons name="stop" size={20} color="#FFF" />
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
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('timer.editTask')}
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
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  taskNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  todayLabel: {
    fontSize: 13,
  },
  todayTime: {
    fontSize: 13,
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
});
