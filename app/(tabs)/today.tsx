import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DayPlanner } from '../../components/planner/DayPlanner';
import {
  formatDisplayDate,
  getNextDay,
  getPreviousDay,
  checkIsToday,
  getRelativeDateLabel,
} from '../../utils/dateHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  const isToday = checkIsToday(selectedDate);

  const handlePreviousDay = () => {
    setSelectedDate(getPreviousDay(selectedDate));
  };

  const handleNextDay = () => {
    setSelectedDate(getNextDay(selectedDate));
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const getDateLabel = () => {
    const label = getRelativeDateLabel(selectedDate);
    if (label === 'today') return t('common.today');
    if (label === 'yesterday') return t('common.yesterday');
    if (label === 'tomorrow') return t('common.tomorrow');
    return label;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('planner.title')}
        </Text>
      </View>

      {/* Date Navigation */}
      <View style={[styles.dateNav, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousDay}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateContainer}
          onPress={handleGoToToday}
          disabled={isToday}
        >
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {getDateLabel()}
          </Text>
          <Text style={[styles.fullDateText, { color: theme.colors.textSecondary }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextDay}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Day Planner */}
      <DayPlanner selectedDate={selectedDate} key={refreshKey} />

      {/* Today Button (if not on today) */}
      {!isToday && (
        <TouchableOpacity
          style={[
            styles.todayButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleGoToToday}
        >
          <Ionicons name="today" size={20} color="#FFF" />
          <Text style={styles.todayButtonText}>{t('common.today')}</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  navButton: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  fullDateText: {
    fontSize: 13,
    marginTop: 2,
  },
  todayButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  todayButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});