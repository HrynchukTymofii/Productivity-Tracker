import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  fullScreen = false,
}) => {
  const { theme } = useTheme();

  const content = (
    <>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && (
        <Text
          style={[
            styles.message,
            { color: theme.colors.textSecondary },
          ]}
        >
          {message}
        </Text>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {content}
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 14,
  },
});
