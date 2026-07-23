import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';

export const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Elegant scale and fade animation for logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Logo container mimicking CDXLogo.jsx */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Text Container */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            CDX <Text style={styles.blueText}>LAST</Text>
          </Text>
          <Text style={styles.subtitle}>Mile Delivery Platform</Text>
        </View>
      </Animated.View>

      <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Deep slate-950
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  blueText: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#60a5fa',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  spinner: {
    position: 'absolute',
    bottom: 60,
  },
});
export default SplashScreen;
