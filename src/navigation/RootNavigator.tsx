import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SplashScreen from '../screens/splash/SplashScreen';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

export const RootNavigator = () => {
  const { token, isLoading } = useAuth();
  const [isSplashShowing, setIsSplashShowing] = useState(true);

  useEffect(() => {
    // Keep splash visible for at least 2 seconds to showcase premium logo animation
    const timer = setTimeout(() => {
      if (!isLoading) {
        setIsSplashShowing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Show splash during bootstrap or until the minimum duration expires
  if (isLoading || isSplashShowing) {
    return <SplashScreen />;
  }

  // Render navigation stack reactively based on session presence
  return token ? <AppStack /> : <AuthStack />;
};
export default RootNavigator;
