import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IconProps {
  color?: string;
  size?: number;
}

export const HomeIcon: React.FC<IconProps> = ({ color = '#2563eb', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={[styles.roofTriangle, { borderBottomColor: color, borderBottomWidth: size * 0.45, borderLeftWidth: size * 0.45, borderRightWidth: size * 0.45 }]} />
    <View style={[styles.houseBase, { backgroundColor: color, width: size * 0.65, height: size * 0.45, marginTop: -size * 0.05 }]} />
  </View>
);

export const ProfileIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={[styles.headCircle, { backgroundColor: color, width: size * 0.42, height: size * 0.42, borderRadius: size * 0.21 }]} />
    <View style={[styles.bodyArc, { backgroundColor: color, width: size * 0.75, height: size * 0.38, borderRadius: size * 0.38, marginTop: size * 0.08 }]} />
  </View>
);

export const EditIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size }]}>
    <View style={[styles.pencilBody, { backgroundColor: color, width: size * 0.3, height: size * 0.65, borderRadius: size * 0.08, transform: [{ rotate: '-45deg' }] }]} />
    <View style={[styles.pencilBaseLine, { backgroundColor: color, width: size * 0.7, height: 2, marginTop: size * 0.15 }]} />
  </View>
);

export const EarningsIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ color, fontSize: size * 0.55, fontWeight: '900', marginTop: -1 }}>₹</Text>
  </View>
);

export const LogoutIcon: React.FC<IconProps> = ({ color = '#ef4444', size = 20 }) => (
  <View style={[styles.iconBase, { width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
    <View style={{ width: size * 0.55, height: size * 0.7, borderRadius: 3, borderWidth: 2, borderColor: color, borderRightWidth: 0 }} />
    <View style={{ width: size * 0.4, height: 2, backgroundColor: color, marginLeft: -size * 0.15 }} />
    <View style={{ width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color, marginLeft: -1 }} />
  </View>
);

const styles = StyleSheet.create({
  iconBase: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  roofTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  houseBase: {
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  headCircle: {},
  bodyArc: {},
  pencilBody: {},
  pencilBaseLine: {},
});
