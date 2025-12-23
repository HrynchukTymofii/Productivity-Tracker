import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';

type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak' | 'idle';

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

interface PomodoroState {
  phase: PomodoroPhase;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  completedSessions: number;
  totalSessionsToday: number;
  totalFocusSecondsToday: number; // Real tracked time
}

interface PomodoroContextType {
  state: PomodoroState;
  settings: PomodoroSettings;
  startWork: () => void;
  startBreak: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  getPhaseLabel: () => string;
  getProgressPercentage: () => number;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

interface PomodoroProviderProps {
  children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [state, setState] = useState<PomodoroState>({
    phase: 'idle',
    remainingSeconds: defaultSettings.workDuration * 60,
    isRunning: false,
    isPaused: false,
    completedSessions: 0,
    totalSessionsToday: 0,
    totalFocusSecondsToday: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick
  useEffect(() => {
    if (state.isRunning && !state.isPaused && state.remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.remainingSeconds <= 1) {
            // Timer completed
            handlePhaseComplete();
            return prev;
          }
          // Track real focus time only during work phase
          const newFocusTime = prev.phase === 'work'
            ? prev.totalFocusSecondsToday + 1
            : prev.totalFocusSecondsToday;
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
            totalFocusSecondsToday: newFocusTime,
          };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused]);

  const handlePhaseComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setState(prev => {
      if (prev.phase === 'work') {
        const newCompletedSessions = prev.completedSessions + 1;
        const isLongBreak = newCompletedSessions % settings.sessionsBeforeLongBreak === 0;

        return {
          ...prev,
          phase: isLongBreak ? 'longBreak' : 'shortBreak',
          remainingSeconds: isLongBreak
            ? settings.longBreakDuration * 60
            : settings.shortBreakDuration * 60,
          completedSessions: newCompletedSessions,
          totalSessionsToday: prev.totalSessionsToday + 1,
          isRunning: true,
          isPaused: false,
        };
      } else {
        // Break completed, start new work session
        return {
          ...prev,
          phase: 'work',
          remainingSeconds: settings.workDuration * 60,
          isRunning: true,
          isPaused: false,
        };
      }
    });
  }, [settings]);

  const startWork = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState(prev => ({
      ...prev,
      phase: 'work',
      remainingSeconds: settings.workDuration * 60,
      isRunning: true,
      isPaused: false,
    }));
  }, [settings.workDuration]);

  const startBreak = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isLongBreak = state.completedSessions % settings.sessionsBeforeLongBreak === 0 && state.completedSessions > 0;
    setState(prev => ({
      ...prev,
      phase: isLongBreak ? 'longBreak' : 'shortBreak',
      remainingSeconds: isLongBreak
        ? settings.longBreakDuration * 60
        : settings.shortBreakDuration * 60,
      isRunning: true,
      isPaused: false,
    }));
  }, [settings, state.completedSessions]);

  const pause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const stop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setState(prev => ({
      ...prev,
      phase: 'idle',
      remainingSeconds: settings.workDuration * 60,
      isRunning: false,
      isPaused: false,
    }));
  }, [settings.workDuration]);

  const skip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handlePhaseComplete();
  }, [handlePhaseComplete]);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Update remaining time if idle
      if (state.phase === 'idle') {
        setState(s => ({ ...s, remainingSeconds: updated.workDuration * 60 }));
      }
      return updated;
    });
  }, [state.phase]);

  const getPhaseLabel = useCallback(() => {
    switch (state.phase) {
      case 'work':
        return 'focusTime';
      case 'shortBreak':
        return 'shortBreak';
      case 'longBreak':
        return 'longBreak';
      default:
        return 'readyToFocus';
    }
  }, [state.phase]);

  const getProgressPercentage = useCallback(() => {
    let totalSeconds: number;
    switch (state.phase) {
      case 'work':
        totalSeconds = settings.workDuration * 60;
        break;
      case 'shortBreak':
        totalSeconds = settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        totalSeconds = settings.longBreakDuration * 60;
        break;
      default:
        totalSeconds = settings.workDuration * 60;
    }
    return ((totalSeconds - state.remainingSeconds) / totalSeconds) * 100;
  }, [state.phase, state.remainingSeconds, settings]);

  const value: PomodoroContextType = {
    state,
    settings,
    startWork,
    startBreak,
    pause,
    resume,
    stop,
    skip,
    updateSettings,
    getPhaseLabel,
    getProgressPercentage,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = (): PomodoroContextType => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
