import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { InitialSetupModal } from './InitialSetupModal';

interface ScreenContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  header?: ReactNode;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right'],
  header,
}) => {
  const { colors, isDark } = useTheme();
  const { orgId } = useAuth();
  const effectiveOrgId = orgId || 'plantation_org_namari_adukidathan';

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {header}
      <View style={[styles.container, { backgroundColor: colors.background }, style]}>
        {children}
      </View>
      <InitialSetupModal orgId={effectiveOrgId} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
