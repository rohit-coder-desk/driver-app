import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../constants/routes';
import HomeScreen from '../screens/dashboard/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyProfileScreen from '../screens/profile/MyProfileScreen';
import MyOrdersScreen from '../screens/orders/MyOrdersScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import HelpSupportScreen from '../screens/support/HelpSupportScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';

const Stack = createNativeStackNavigator();

export const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.MY_PROFILE} component={MyProfileScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={ROUTES.MY_ORDERS} component={MyOrdersScreen} />
      <Stack.Screen name={ROUTES.ORDER_DETAILS} component={OrderDetailsScreen} />
      <Stack.Screen name={ROUTES.DOCUMENTS} component={DocumentsScreen} />
      <Stack.Screen name={ROUTES.HELP_SUPPORT} component={HelpSupportScreen} />
      <Stack.Screen name={ROUTES.EARNINGS} component={EarningsScreen} />
    </Stack.Navigator>
  );
};
export default AppStack;
