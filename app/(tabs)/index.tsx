import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TextInput,
  Platform,
  TouchableOpacity,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTimer } from '../../contexts/TimerContext';
import { usePomodoro } from '../../contexts/PomodoroContext';
import { TaskItem } from '../../components/timer/TaskItem';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { TimerDisplay } from '../../components/timer/TimerDisplay';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const formatPomodoroTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function TimerScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { tasks, createTask, startTimer, pauseTimer, resumeTimer, stopTimer, timerState, activeTask } = useTimer();
  const { state: pomodoroState, getPhaseLabel, startWork } = usePomodoro();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [newTaskName, setNewTaskName] = useState('');
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardShowEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: e.endCoordinates.height - insets.bottom - 24,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    const hideSubscription = Keyboard.addListener(keyboardHideEvent, (e) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardOffset]);

  const handleCreateTask = async () => {
    if (newTaskName.trim()) {
      const task = await createTask(newTaskName.trim());
      setNewTaskName('');

      // Auto-start the timer for the new task
      await startTimer(task.id);

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

  const handleOpenPomodoro = () => {
    router.push('/pomodoro');
  };

  const getPomodoroColor = () => {
    switch (pomodoroState.phase) {
      case 'work':
        return '#e74c3c';
      case 'shortBreak':
        return '#2ecc71';
      case 'longBreak':
        return '#3498db';
      default:
        return '#e74c3c';
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

        {/* Timer Controls */}
        <View style={styles.activeTimerControls}>
          {timerState.isPaused ? (
            <TouchableOpacity
              style={styles.timerControlButtonOuter}
              onPress={resumeTimer}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5cd85c', '#2ecc71', '#27ae60']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.timerControlButton}
              >
                <View style={styles.glassOverlay} />
                <Ionicons name="play" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.timerControlButtonOuter}
              onPress={pauseTimer}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f9ca24', '#f39c12', '#e67e22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.timerControlButton}
              >
                <View style={styles.glassOverlay} />
                <Ionicons name="pause" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.timerControlButtonOuter}
            onPress={stopTimer}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a5a', '#c0392b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.timerControlButton}
            >
              <View style={styles.glassOverlay} />
              <Ionicons name="stop" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Fullscreen Link */}
        <TouchableOpacity
          style={[styles.fullScreenLink, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={handleOpenFullScreen}
        >
          <Ionicons name="expand" size={18} color={theme.colors.primary} />
          <Text style={[styles.fullScreenLinkText, { color: theme.colors.primary }]}>
            {t('timer.openFullScreen')}
          </Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderTask = ({ item }: { item: (typeof tasks)[0] }) => {
    // Don't render the active task in the list (it's shown separately above)
    if (timerState.activeTaskId === item.id) return null;

    return (
      <TaskItem
        task={item}
        onOpenFullScreen={undefined}
      />
    );
  };

  const renderPomodoroButton = () => {
    const pomodoroColor = getPomodoroColor();
    const isActive = pomodoroState.isRunning;

    return (
      <TouchableOpacity
        style={styles.pomodoroButtonOuter}
        onPress={handleOpenPomodoro}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isActive ? [pomodoroColor, pomodoroColor, pomodoroColor] : ['#ff6347', '#e74c3c', '#c0392b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.pomodoroButton}
        >
          <View style={styles.pomodoroButtonGlass} />
          {isActive ? (
            <View style={styles.pomodoroActiveIndicator}>
              <Text style={styles.pomodoroActiveTime}>
                {formatPomodoroTime(pomodoroState.remainingSeconds)}
              </Text>
            </View>
          ) : (<Text style={styles.tomatoEmoji}>🍅</Text>)}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('timer.title')}
        </Text>
        {renderPomodoroButton()}
      </View>
      {renderActiveTimer()}
    </>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <View style={styles.emptyHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('timer.title')}
        </Text>
        {renderPomodoroButton()}
      </View>
      <EmptyState
        icon="timer-outline"
        title={t('timer.noTasks')}
        subtitle={t('timer.createFirstTask')}
      />
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
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
            : [styles.listContent, { paddingBottom: insets.top, paddingTop: insets.bottom + 110 }]
        }
        showsVerticalScrollIndicator={false}
        inverted={tasks.length > 0}
      />

      {/* Fixed Bottom Input Form */}
      <Animated.View
        style={[
          styles.bottomInputContainer,
          {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.primary,
            paddingBottom: insets.bottom + 12,
            bottom: keyboardOffset,
          },
        ]}
      >
        <View style={styles.inputHeader}>
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.inputLabel, { color: theme.colors.primary }]}>
            {t('timer.createTask')}
          </Text>
        </View>
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                },
              ]}
              value={newTaskName}
              onChangeText={setNewTaskName}
              placeholder={t('timer.enterTaskName')}
              placeholderTextColor={theme.colors.placeholder}
              returnKeyType="done"
              onSubmitEditing={handleCreateTask}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: newTaskName.trim()
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
            onPress={handleCreateTask}
            disabled={!newTaskName.trim()}
          >
            <Ionicons
              name="arrow-forward"
              size={24}
              color={newTaskName.trim() ? '#FFF' : theme.colors.placeholder}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
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
  },
  emptyContainer: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  activeTimerControls: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  timerControlButtonOuter: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  timerControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  fullScreenLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  fullScreenLinkText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  pomodoroButtonOuter: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pomodoroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pomodoroButtonGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  tomatoEmoji: {
    fontSize: 22,
  },
  pomodoroActiveIndicator: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  pomodoroActiveTime: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  emptyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  bottomInputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    paddingHorizontal: 16,
    paddingTop: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginRight: 12,
    paddingHorizontal: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
