import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface FlipCardProps {
  value: string;
  previousValue: string;
  size?: 'small' | 'large';
  textColor?: string;
  backgroundColor?: string;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  value,
  previousValue,
  size = 'large',
  textColor = '#FFFFFF',
  backgroundColor = '#1a1a2e',
}) => {
  const flipAnim = useRef(new Animated.Value(0)).current;

  const cardWidth = size === 'large' ? 100 : 50;
  const cardHeight = size === 'large' ? 130 : 65;
  const fontSize = size === 'large' ? 90 : 44;

  useEffect(() => {
    if (value !== previousValue) {
      flipAnim.setValue(0);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [value, previousValue, flipAnim]);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-90deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={[styles.container, { width: cardWidth, height: cardHeight }]}>
      {/* Static bottom half showing new value */}
      <View
        style={[
          styles.cardHalf,
          styles.bottomHalf,
          {
            backgroundColor,
            width: cardWidth,
            height: cardHeight / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            styles.bottomText,
            {
              fontSize,
              color: textColor,
              lineHeight: cardHeight,
              top: -cardHeight / 2,
            },
          ]}
        >
          {value}
        </Text>
      </View>

      {/* Static top half showing new value */}
      <View
        style={[
          styles.cardHalf,
          styles.topHalf,
          {
            backgroundColor,
            width: cardWidth,
            height: cardHeight / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize,
              color: textColor,
              lineHeight: cardHeight,
            },
          ]}
        >
          {value}
        </Text>
      </View>

      {/* Animated top flap (shows old value, flips down) */}
      <Animated.View
        style={[
          styles.cardHalf,
          styles.topHalf,
          styles.flipCard,
          {
            backgroundColor,
            width: cardWidth,
            height: cardHeight / 2,
            transform: [
              { perspective: 400 },
              { rotateX: frontRotate },
            ],
            opacity: frontOpacity,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize,
              color: textColor,
              lineHeight: cardHeight,
            },
          ]}
        >
          {previousValue}
        </Text>
      </Animated.View>

      {/* Animated bottom flap (shows new value, flips into place) */}
      <Animated.View
        style={[
          styles.cardHalf,
          styles.bottomHalf,
          styles.flipCard,
          {
            backgroundColor,
            width: cardWidth,
            height: cardHeight / 2,
            transform: [
              { perspective: 400 },
              { rotateX: backRotate },
            ],
            opacity: backOpacity,
            transformOrigin: 'top',
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            styles.bottomText,
            {
              fontSize,
              color: textColor,
              lineHeight: cardHeight,
              top: -cardHeight / 2,
            },
          ]}
        >
          {value}
        </Text>
      </Animated.View>

      {/* Center line */}
      <View style={[styles.centerLine, { width: cardWidth }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: 3,
  },
  cardHalf: {
    position: 'absolute',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  topHalf: {
    top: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bottomHalf: {
    bottom: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  flipCard: {
    zIndex: 10,
  },
  text: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bottomText: {
    position: 'absolute',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 20,
  },
});
