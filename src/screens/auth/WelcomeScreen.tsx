import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/routes';

export const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../../assets/images/d9fb62da-5211-4233-af7e-28781fdfbe03.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dark Gradient / Vignette Overlay for Readability */}
        <View style={styles.darkOverlay}>
          {/* Top Header & Branding */}
          <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 24, 52) }]}>
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Brand Title: CDX LAST */}
            <View style={styles.brandRow}>
              <Text style={styles.brandCD}>CD</Text>
              <Text style={styles.brandX}>X </Text>
              <Text style={styles.brandLAST}>LAST</Text>
            </View>

            {/* Subtitle: —— DRIVER APP —— */}
            <View style={styles.subtitleRow}>
              <View style={styles.line} />
              <Text style={styles.subtitleText}>DRIVER APP</Text>
              <View style={styles.line} />
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.flexSpacer} />

          {/* Bottom Content Area */}
          <View style={[styles.bottomContent, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
            {/* Tagline */}
            <Text style={styles.headlineTitle}>Deliver Orders.</Text>
            <Text style={styles.headlineSubtitle}>Make Every Delivery Count.</Text>

            <Text style={styles.descriptionText}>
              Accept orders, reach on time{'\n'}and make your customers happy.
            </Text>

            {/* Get Started Button -> Register */}
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => navigation.navigate(ROUTES.REGISTER)}
              activeOpacity={0.85}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>

            {/* Have an account already? SIGN IN -> Login */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Have an account already? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.LOGIN)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.signInText}>SIGN IN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030A16',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 10, 22, 0.10)',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
  },
  logoCard: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandCD: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandX: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0066FF',
    letterSpacing: 1,
  },
  brandLAST: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  line: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 2.5,
    marginHorizontal: 8,
  },
  flexSpacer: {
    flex: 1,
  },
  bottomContent: {
    width: '100%',
  },
  headlineTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  headlineSubtitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0066FF',
    lineHeight: 34,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 32,
  },
  getStartedBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
  },
  signInText: {
    fontSize: 13,
    color: '#0066FF',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
