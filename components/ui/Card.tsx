import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 16,
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding,
    shadowColor: theme.dark ? '#000' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 3,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

export const CardSection: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}> = ({ children, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          paddingVertical: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
