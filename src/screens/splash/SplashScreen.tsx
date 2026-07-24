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
        {/* Logo container */}
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

      <ActivityIndicator size="small" color="#2563eb" style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 68,
    height: 68,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  blueText: {
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb',
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
