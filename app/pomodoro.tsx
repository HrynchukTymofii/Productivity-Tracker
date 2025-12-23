import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePomodoro } from '../contexts/PomodoroContext';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function PomodoroScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    state,
    settings,
    startWork,
    pause,
    resume,
    stop,
    skip,
    getPhaseLabel,
    getProgressPercentage,
  } = usePomodoro();

  const handleClose = () => {
    router.back();
  };

  const getPhaseColor = () => {
    switch (state.phase) {
      case 'work':
        return '#e74c3c';
      case 'shortBreak':
        return '#2ecc71';
      case 'longBreak':
        return '#3498db';
      default:
        return theme.colors.primary;
    }
  };

  const getPhaseGradient = (): [string, string, string] => {
    switch (state.phase) {
      case 'work':
        return ['#ff6b6b', '#ee5a5a', '#c0392b'];
      case 'shortBreak':
        return ['#5cd85c', '#2ecc71', '#27ae60'];
      case 'longBreak':
        return ['#5dade2', '#3498db', '#2980b9'];
      default:
        return ['#a29bfe', '#6c5ce7', '#5b4cdb'];
    }
  };

  const phaseColor = getPhaseColor();
  const progress = getProgressPercentage();

  // Circle progress
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('pomodoro.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Phase Label */}
        <Text style={[styles.phaseLabel, { color: phaseColor }]}>
          {t(`pomodoro.${getPhaseLabel()}`)}
        </Text>

        {/* Session Counter */}
        <View style={styles.sessionCounter}>
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.sessionDot,
                {
                  backgroundColor:
                    i < state.completedSessions % settings.sessionsBeforeLongBreak
                      ? phaseColor
                      : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Timer Circle */}
        <View style={styles.timerCircleContainer}>
          <Svg width={size} height={size} style={styles.progressCircle}>
            {/* Background Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={phaseColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Timer Text */}
          <View style={styles.timerTextContainer}>
            <Text style={[styles.timerText, { color: theme.colors.text }]}>
              {formatTime(state.remainingSeconds)}
            </Text>
            <Text style={[styles.timerSubtext, { color: theme.colors.textSecondary }]}>
              {state.isRunning
                ? state.isPaused
                  ? t('pomodoro.paused')
                  : t('pomodoro.running')
                : t('pomodoro.ready')}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {state.totalSessionsToday}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('pomodoro.sessionsToday')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {Math.floor(state.totalFocusSecondsToday / 3600)}{t('common.h')}{' '}
              {Math.floor((state.totalFocusSecondsToday % 3600) / 60)}{t('common.m')}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t('pomodoro.focusTimeLabel')}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!state.isRunning ? (
            <TouchableOpacity
              style={styles.mainButtonOuter}
              onPress={startWork}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={getPhaseGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.mainButton}
              >
                <View style={styles.glassOverlay} />
                <Ionicons name="play" size={40} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              {state.isPaused ? (
                <TouchableOpacity
                  style={styles.controlButtonOuter}
                  onPress={resume}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#5cd85c', '#2ecc71', '#27ae60']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.controlButton}
                  >
                    <View style={styles.glassOverlaySmall} />
                    <Ionicons name="play" size={28} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.controlButtonOuter}
                  onPress={pause}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f9ca24', '#f39c12', '#e67e22']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.controlButton}
                  >
                    <View style={styles.glassOverlaySmall} />
                    <Ionicons name="pause" size={28} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.controlButtonOuter}
                onPress={skip}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#a29bfe', '#6c5ce7', '#5b4cdb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.controlButton}
                >
                  <View style={styles.glassOverlaySmall} />
                  <Ionicons name="play-skip-forward" size={28} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButtonOuter}
                onPress={stop}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#ee5a5a', '#c0392b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.controlButton}
                >
                  <View style={styles.glassOverlaySmall} />
                  <Ionicons name="stop" size={28} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Duration Settings Quick Access */}
        <View style={styles.durationRow}>
          <View style={[styles.durationItem, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="briefcase-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.durationText, { color: theme.colors.text }]}>
              {settings.workDuration}m
            </Text>
          </View>
          <View style={[styles.durationItem, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="cafe-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.durationText, { color: theme.colors.text }]}>
              {settings.shortBreakDuration}m
            </Text>
          </View>
          <View style={[styles.durationItem, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="bed-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.durationText, { color: theme.colors.text }]}>
              {settings.longBreakDuration}m
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  phaseLabel: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  sessionCounter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  sessionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timerCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressCircle: {
    transform: [{ rotateZ: '0deg' }],
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  mainButtonOuter: {
    borderRadius: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 15,
  },
  mainButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  controlButtonOuter: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
  },
  glassOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
