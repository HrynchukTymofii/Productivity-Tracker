import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Task, TimeEntry, TimerState } from '../types';
import {
  getAllTasks,
  createTask as createTaskDB,
  updateTaskName as updateTaskNameDB,
  createTimeEntry,
  updateTimeEntryEnd,
  pauseTimeEntry,
  resumeTimeEntry,
  getActiveTimeEntry,
  getTaskById,
  getTaskCount,
  getTotalSecondsForTaskToday,
} from '../database/queries';
import { useTheme } from './ThemeContext';

interface TimerContextType {
  // Tasks
  tasks: Task[];
  loadTasks: () => Promise<void>;
  createTask: (name: string) => Promise<Task>;
  updateTaskName: (taskId: number, newName: string) => Promise<void>;

  // Timer state
  timerState: TimerState;
  activeTask: Task | null;

  // Timer controls
  startTimer: (taskId: number) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;

  // Utilities
  getTodayTotal: (taskId: number) => Promise<number>;
  isLoading: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const { getTaskColor } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timerState, setTimerState] = useState<TimerState>({
    activeTaskId: null,
    activeEntryId: null,
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    startTime: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const accumulatedRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
    restoreTimerState();
  }, []);

  // Timer interval
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = new Date();
          const elapsed = Math.floor(
            (now.getTime() - startTimeRef.current.getTime()) / 1000
          );
          setTimerState(prev => ({
            ...prev,
            elapsedSeconds: accumulatedRef.current + elapsed,
          }));
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused]);

  // Handle app state changes for background timer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [timerState]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - update elapsed time
        if (timerState.isRunning && !timerState.isPaused && startTimeRef.current) {
          const now = new Date();
          const elapsed = Math.floor(
            (now.getTime() - startTimeRef.current.getTime()) / 1000
          );
          setTimerState(prev => ({
            ...prev,
            elapsedSeconds: accumulatedRef.current + elapsed,
          }));
        }
      }
      appStateRef.current = nextAppState;
    },
    [timerState.isRunning, timerState.isPaused]
  );

  const restoreTimerState = async () => {
    try {
      const activeEntry = await getActiveTimeEntry();
      if (activeEntry) {
        const task = await getTaskById(activeEntry.task_id);
        if (task) {
          setActiveTask(task);

          const startTime = new Date(activeEntry.start_time);
          const accumulated = activeEntry.accumulated_seconds || 0;

          if (activeEntry.is_paused) {
            // Timer was paused
            accumulatedRef.current = accumulated;
            setTimerState({
              activeTaskId: task.id,
              activeEntryId: activeEntry.id,
              isRunning: true,
              isPaused: true,
              elapsedSeconds: accumulated,
              startTime: null,
            });
          } else {
            // Timer is running
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            accumulatedRef.current = accumulated;
            startTimeRef.current = startTime;

            setTimerState({
              activeTaskId: task.id,
              activeEntryId: activeEntry.id,
              isRunning: true,
              isPaused: false,
              elapsedSeconds: accumulated + elapsed,
              startTime,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error restoring timer state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const allTasks = await getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const createTask = useCallback(
    async (name: string): Promise<Task> => {
      const taskCount = await getTaskCount();
      const color = getTaskColor(taskCount);
      const taskId = await createTaskDB(name, color);
      const newTask: Task = {
        id: taskId,
        task_name: name,
        color,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    },
    [getTaskColor]
  );

  const updateTaskName = useCallback(async (taskId: number, newName: string) => {
    await updateTaskNameDB(taskId, newName);
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, task_name: newName, updated_at: new Date().toISOString() }
          : task
      )
    );
    if (activeTask?.id === taskId) {
      setActiveTask(prev => (prev ? { ...prev, task_name: newName } : null));
    }
  }, [activeTask]);

  const startTimer = useCallback(
    async (taskId: number) => {
      // If there's an active timer on a different task, pause it first
      if (timerState.isRunning && timerState.activeTaskId !== taskId) {
        await pauseTimer();
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const now = new Date();
      const entryId = await createTimeEntry(taskId, now);

      startTimeRef.current = now;
      accumulatedRef.current = 0;

      setActiveTask(task);
      setTimerState({
        activeTaskId: taskId,
        activeEntryId: entryId,
        isRunning: true,
        isPaused: false,
        elapsedSeconds: 0,
        startTime: now,
      });
    },
    [tasks, timerState]
  );

  const pauseTimer = useCallback(async () => {
    if (!timerState.isRunning || timerState.isPaused || !timerState.activeEntryId)
      return;

    const now = new Date();
    let elapsed = 0;

    if (startTimeRef.current) {
      elapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
    }

    const totalAccumulated = accumulatedRef.current + elapsed;
    accumulatedRef.current = totalAccumulated;

    await pauseTimeEntry(timerState.activeEntryId, now, totalAccumulated);

    startTimeRef.current = null;
    setTimerState(prev => ({
      ...prev,
      isPaused: true,
      elapsedSeconds: totalAccumulated,
      startTime: null,
    }));
  }, [timerState]);

  const resumeTimer = useCallback(async () => {
    if (!timerState.isRunning || !timerState.isPaused || !timerState.activeEntryId)
      return;

    const now = new Date();
    startTimeRef.current = now;

    await resumeTimeEntry(timerState.activeEntryId, now);

    setTimerState(prev => ({
      ...prev,
      isPaused: false,
      startTime: now,
    }));
  }, [timerState]);

  const stopTimer = useCallback(async () => {
    if (!timerState.isRunning || !timerState.activeEntryId) return;

    const now = new Date();
    let totalSeconds = accumulatedRef.current;

    if (!timerState.isPaused && startTimeRef.current) {
      const elapsed = Math.floor(
        (now.getTime() - startTimeRef.current.getTime()) / 1000
      );
      totalSeconds += elapsed;
    }

    await updateTimeEntryEnd(timerState.activeEntryId, now, totalSeconds);

    // Reset timer state
    startTimeRef.current = null;
    accumulatedRef.current = 0;

    setActiveTask(null);
    setTimerState({
      activeTaskId: null,
      activeEntryId: null,
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      startTime: null,
    });
  }, [timerState]);

  const getTodayTotal = useCallback(async (taskId: number): Promise<number> => {
    return await getTotalSecondsForTaskToday(taskId);
  }, []);

  const value: TimerContextType = {
    tasks,
    loadTasks,
    createTask,
    updateTaskName,
    timerState,
    activeTask,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    getTodayTotal,
    isLoading,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
