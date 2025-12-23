import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlipCard } from './FlipCard';

interface FlipClockProps {
  seconds: number;
  textColor?: string;
  backgroundColor?: string;
  separatorColor?: string;
  size?: 'small' | 'large';
}

export const FlipClock: React.FC<FlipClockProps> = ({
  seconds,
  textColor = '#FFFFFF',
  backgroundColor = '#1a1a2e',
  separatorColor,
  size = 'large',
}) => {
  const prevSecondsRef = useRef(seconds);
  const [prevTime, setPrevTime] = useState({ hours: '00', minutes: '00', seconds: '00' });

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const formatNumber = (num: number): string => num.toString().padStart(2, '0');

  const currentTime = {
    hours: formatNumber(hours),
    minutes: formatNumber(minutes),
    seconds: formatNumber(secs),
  };

  useEffect(() => {
    if (seconds !== prevSecondsRef.current) {
      const prevSecs = prevSecondsRef.current;
      const prevHours = Math.floor(prevSecs / 3600);
      const prevMins = Math.floor((prevSecs % 3600) / 60);
      const prevSecond = prevSecs % 60;

      setPrevTime({
        hours: formatNumber(prevHours),
        minutes: formatNumber(prevMins),
        seconds: formatNumber(prevSecond),
      });

      prevSecondsRef.current = seconds;
    }
  }, [seconds]);

  const sepColor = separatorColor || textColor;
  const separatorSize = size === 'large' ? 48 : 32;

  return (
    <View style={styles.container}>
      {/* Hours */}
      <View style={styles.digitGroup}>
        <FlipCard
          value={currentTime.hours[0]}
          previousValue={prevTime.hours[0]}
          size={size}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
        <FlipCard
          value={currentTime.hours[1]}
          previousValue={prevTime.hours[1]}
          size={size}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
      </View>

      <Text style={[styles.separator, { color: sepColor, fontSize: separatorSize }]}>:</Text>

      {/* Minutes */}
      <View style={styles.digitGroup}>
        <FlipCard
          value={currentTime.minutes[0]}
          previousValue={prevTime.minutes[0]}
          size={size}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
        <FlipCard
          value={currentTime.minutes[1]}
          previousValue={prevTime.minutes[1]}
          size={size}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
      </View>

      <Text style={[styles.separator, { color: sepColor, fontSize: separatorSize }]}>:</Text>

      {/* Seconds */}
      <View style={styles.digitGroup}>
        <FlipCard
          value={currentTime.seconds[0]}
          previousValue={prevTime.seconds[0]}
          size={size}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
        <FlipCard
          value={currentTime.seconds[1]}
          previousValue={prevTime.seconds[1]}
          size={size}
          textColor={textColor}
          backgroundColor={backgroundColor}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitGroup: {
    flexDirection: 'row',
  },
  separator: {
    fontWeight: '700',
    marginHorizontal: 8,
  },
});
