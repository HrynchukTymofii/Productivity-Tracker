import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTimer } from '../contexts/TimerContext';
import { formatTime } from '../utils/timeFormatter';
import { FlipClock } from '../components/timer/FlipClock';

type TimerStyle = 'digital' | 'flip';

export default function FullScreenTimerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string; taskName: string }>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { timerState, pauseTimer, resumeTimer, stopTimer, activeTask } = useTimer();
  const insets = useSafeAreaInsets();

  const taskName = params.taskName || '';
  const [timerStyle, setTimerStyle] = useState<TimerStyle>('digital');

  const toggleTimerStyle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimerStyle(prev => prev === 'digital' ? 'flip' : 'digital');
  };

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
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  const isPaused = timerState.isPaused;
  const taskColor = activeTask?.color || theme.colors.primary;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.background,
        paddingLeft: insets.left + 16,
        paddingRight: insets.right + 16,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    ]}>
      <StatusBar hidden />

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 16, right: insets.right + 16 }]}
        onPress={handleClose}
      >
        <Ionicons name="close" size={32} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Timer Style Toggle */}
      <View style={[styles.toggleContainer, { top: insets.top + 16, left: insets.left + 16 }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            timerStyle === 'digital' && { backgroundColor: theme.colors.primary },
            { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
          ]}
          onPress={() => timerStyle !== 'digital' && toggleTimerStyle()}
        >
          <Ionicons
            name="text"
            size={20}
            color={timerStyle === 'digital' ? '#FFF' : theme.colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            timerStyle === 'flip' && { backgroundColor: theme.colors.primary },
            { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
          ]}
          onPress={() => timerStyle !== 'flip' && toggleTimerStyle()}
        >
          <Ionicons
            name="albums"
            size={20}
            color={timerStyle === 'flip' ? '#FFF' : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

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
          {timerStyle === 'digital' ? (
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
          ) : (
            <FlipClock
              seconds={timerState.elapsedSeconds}
              textColor={isPaused ? theme.colors.warning : '#FFFFFF'}
              backgroundColor={theme.dark ? '#2a2a3e' : '#1a1a2e'}
              separatorColor={isPaused ? theme.colors.warning : theme.colors.text}
              size="large"
            />
          )}
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
              style={styles.controlButtonOuter}
              onPress={handleResume}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#5cd85c', '#2ecc71', '#27ae60']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.controlButton}
              >
                <View style={styles.glassOverlay} />
                <Ionicons name="play" size={32} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.controlButtonOuter}
              onPress={handlePause}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f9ca24', '#f39c12', '#e67e22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.controlButton}
              >
                <View style={styles.glassOverlay} />
                <Ionicons name="pause" size={32} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.controlButtonOuter}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a5a', '#c0392b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.controlButton}
            >
              <View style={styles.glassOverlay} />
              <Ionicons name="stop" size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
  toggleContainer: {
    position: 'absolute',
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    marginBottom: 32,
  },
  timer: {
    fontSize: 120,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  pausedLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 2,
    position: 'absolute',
    bottom: -32,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonOuter: {
    marginHorizontal: 16,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
});
