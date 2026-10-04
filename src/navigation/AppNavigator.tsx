import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MainTabParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { ActivityScreen } from '../screens/activity/ActivityScreen';
import { HarvestScreen } from '../screens/harvest/HarvestScreen';
import { CuringScreen } from '../screens/curing/CuringScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { PnLScreen } from '../screens/pnl/PnLScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { role } = useAuth();
  const { t } = useLanguage();
  const isAdmin = role === 'admin';

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      {/* 1. EXECUTIVE MIS DASHBOARD */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('dashboard'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 2. ATTENDANCE & LABOR */}
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: t('attendance'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 3. HARVEST & CURING (UNIFIED) */}
      <Tab.Screen
        name="Harvest"
        component={HarvestScreen}
        options={{
          tabBarLabel: t('harvest'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'basket' : 'basket-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 4. FIELD ACTIVITIES */}
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarLabel: t('activity'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'leaf' : 'leaf-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 5. EXPENSES & INVENTORY */}
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{
          tabBarLabel: t('expenses'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* HIDDEN SCREENS (Accessible via direct routing / in-app triggers) */}
      <Tab.Screen
        name="Curing"
        component={CuringScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
        }}
      />

      <Tab.Screen
        name="PnL"
        component={PnLScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
};
