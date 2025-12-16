import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTimer } from '../contexts/TimerContext';
import { formatTime } from '../utils/timeFormatter';
import { RootStackParamList } from '../types';

type FullScreenTimerRouteProp = RouteProp<RootStackParamList, 'FullScreenTimer'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FullScreenTimerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<FullScreenTimerRouteProp>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { timerState, pauseTimer, resumeTimer, stopTimer, activeTask } = useTimer();

  const { taskName } = route.params;

  useEffect(() => {
    // Lock to landscape orientation
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    };
    lockOrientation();

    return () => {
      // Unlock orientation when leaving
      ScreenOrientation.unlockAsync();
    };
  }, []);

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
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const isPaused = timerState.isPaused;
  const taskColor = activeTask?.color || theme.colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar hidden />

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={32} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Task Name */}
        <Text
          style={[styles.taskName, { color: taskColor }]}
          numberOfLines={1}
        >
          {taskName}
        </Text>

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <Text
            style={[
              styles.timer,
              {
                color: isPaused ? theme.colors.warning : theme.colors.text,
              },
            ]}
          >
            {formatTime(timerState.elapsedSeconds)}
          </Text>
          {isPaused && (
            <Text style={[styles.pausedLabel, { color: theme.colors.warning }]}>
              {t('fullScreenTimer.paused')}
            </Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {isPaused ? (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.success }]}
              onPress={handleResume}
            >
              <Ionicons name="play" size={48} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.warning }]}
              onPress={handlePause}
            >
              <Ionicons name="pause" size={48} color="#FFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.error }]}
            onPress={handleStop}
          >
            <Ionicons name="stop" size={48} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  taskName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  timer: {
    fontSize: 120,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  pausedLabel: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
