import React from 'react';
import { View, StyleSheet } from 'react-native';

interface EyeIconProps {
  visible: boolean; // true = password visible (eye open), false = password hidden (eye slash)
  color?: string;
  size?: number;
}

export const EyeIcon: React.FC<EyeIconProps> = ({
  visible,
  color = '#94A3B8',
  size = 24,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Horizontal Almond-shaped Realistic Eye Shell */}
      <View style={[styles.eyeShell, { borderColor: color }]}>
        {/* Iris / Pupil */}
        <View style={[styles.irisRing, { borderColor: color }]}>
          <View style={[styles.pupilDot, { backgroundColor: color }]} />
        </View>
      </View>

      {/* Diagonal Slash line when password is hidden */}
      {!visible && (
        <View style={[styles.slashLine, { backgroundColor: color }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyeShell: {
    width: 19,
    height: 19,
    borderWidth: 2,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  irisRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pupilDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },
  slashLine: {
    position: 'absolute',
    width: 24,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
});

export default EyeIcon;
