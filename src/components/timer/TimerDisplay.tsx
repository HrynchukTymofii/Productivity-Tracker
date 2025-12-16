import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { formatTime } from '../../utils/timeFormatter';

interface TimerDisplayProps {
  seconds: number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  isPaused?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  seconds,
  size = 'medium',
  style,
  isPaused = false,
}) => {
  const { theme } = useTheme();

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 36;
      case 'large':
        return 48;
      case 'xlarge':
        return 72;
      default:
        return 36;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.time,
          {
            color: isPaused ? theme.colors.warning : theme.colors.text,
            fontSize: getFontSize(),
          },
        ]}
      >
        {formatTime(seconds)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
});
