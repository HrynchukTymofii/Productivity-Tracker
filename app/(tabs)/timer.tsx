import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useTimer } from '../../src/contexts/TimerContext';
import { TaskItem } from '../../src/components/timer/TaskItem';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { TimerDisplay } from '../../src/components/timer/TimerDisplay';

export default function TimerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { tasks, createTask, timerState, activeTask } = useTimer();

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const handleCreateTask = async () => {
    if (newTaskName.trim()) {
      await createTask(newTaskName.trim());
      setNewTaskName('');
      setIsCreateModalVisible(false);
      Toast.show({
        type: 'success',
        text1: t('timer.taskCreated'),
        visibilityTime: 2000,
      });
    }
  };

  const handleOpenFullScreen = () => {
    if (activeTask) {
      router.push({
        pathname: '/full-screen-timer',
        params: {
          taskId: activeTask.id,
          taskName: activeTask.task_name,
        },
      });
    }
  };

  const renderActiveTimer = () => {
    if (!timerState.isRunning || !activeTask) return null;

    return (
      <Card style={[styles.activeTimerCard, { borderColor: activeTask.color }]}>
        <View style={styles.activeTimerHeader}>
          <View
            style={[styles.activeIndicator, { backgroundColor: activeTask.color }]}
          />
          <Text style={[styles.activeTimerLabel, { color: theme.colors.textSecondary }]}>
            {t('timer.activeTimer')}
          </Text>
        </View>
        <Text style={[styles.activeTaskName, { color: theme.colors.text }]}>
          {activeTask.task_name}
        </Text>
        <TimerDisplay
          seconds={timerState.elapsedSeconds}
          size="large"
          isPaused={timerState.isPaused}
          style={styles.activeTimerDisplay}
        />
        {timerState.isPaused && (
          <View
            style={[
              styles.pausedBadge,
              { backgroundColor: theme.colors.warning + '20' },
            ]}
          >
            <Text style={[styles.pausedBadgeText, { color: theme.colors.warning }]}>
              {t('fullScreenTimer.paused')}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderTask = ({ item }: { item: (typeof tasks)[0] }) => (
    <TaskItem
      task={item}
      onOpenFullScreen={
        timerState.activeTaskId === item.id ? handleOpenFullScreen : undefined
      }
    />
  );

  const renderHeader = () => (
    <>
      {renderActiveTimer()}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('timer.title')}
        </Text>
        <Button
          title={t('timer.newTask')}
          onPress={() => setIsCreateModalVisible(true)}
          size="small"
          icon={<Ionicons name="add" size={18} color="#FFF" />}
        />
      </View>
    </>
  );

  const renderEmptyList = () => (
    <EmptyState
      icon="timer-outline"
      title={t('timer.noTasks')}
      subtitle={t('timer.createFirstTask')}
      action={
        <Button
          title={t('timer.createTask')}
          onPress={() => setIsCreateModalVisible(true)}
          icon={<Ionicons name="add" size={18} color="#FFF" />}
        />
      }
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <FlatList
        data={tasks}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTask}
        ListHeaderComponent={tasks.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          tasks.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Task Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.colors.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('timer.newTask')}
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
              value={newTaskName}
              onChangeText={setNewTaskName}
              placeholder={t('timer.enterTaskName')}
              placeholderTextColor={theme.colors.placeholder}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateTask}
            />
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => {
                  setNewTaskName('');
                  setIsCreateModalVisible(false);
                }}
                style={styles.modalButton}
              />
              <Button
                title={t('timer.createTask')}
                onPress={handleCreateTask}
                disabled={!newTaskName.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  activeTimerCard: {
    marginBottom: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  activeTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  activeTimerLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeTaskName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  activeTimerDisplay: {
    marginVertical: 8,
  },
  pausedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  pausedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
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
