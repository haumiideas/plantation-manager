import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { formatDateWithDay } from '../../utils/date';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { signInWithGoogle, signInDemoUser, isFirebaseReady, isLoading, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(error);

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1234567890-dummy.apps.googleusercontent.com';
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleClientId;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleClientId;

  // Google OAuth Session configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
    webClientId: googleClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        signInWithGoogle(id_token).catch((err) => {
          setAuthError(err?.message || 'Failed to authenticate with Firebase.');
        });
      }
    } else if (response?.type === 'error') {
      setAuthError('Google sign-in was cancelled or failed.');
    }
  }, [response]);

  const handleGoogleSignInPress = () => {
    if (!isFirebaseReady || googleClientId.includes('dummy')) {
      setAuthError('Google Cloud & Firebase credentials are not yet configured in .env. Please use the Instant Evaluation buttons below to test the app.');
      return;
    }
    if (promptAsync) {
      promptAsync().catch((err) => setAuthError(err?.message || 'Failed to open Google sign-in'));
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Right Theme Toggle */}
        <View style={styles.topBar}>
          <Text style={[styles.todayText, { color: colors.textMuted }]}>
            {formatDateWithDay()}
          </Text>
          <ThemeToggle />
        </View>

        {/* Plantation Branding Hero */}
        <View style={styles.brandHero}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark ? '#14311F' : '#D1FAE5',
                borderColor: isDark ? '#235836' : '#6EE7B7',
              },
            ]}
          >
            <Ionicons
              name="leaf"
              size={48}
              color={isDark ? colors.primaryLight : colors.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Farmag App</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Namari & Adukidathan Plantations
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.surfaceSubtle }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              Cardamom & Pepper Operations • Phase 0
            </Text>
          </View>
        </View>

        {/* Error Notification */}
        {authError && (
          <View
            style={[
              styles.errorCard,
              { backgroundColor: isDark ? '#3B1212' : '#FEE2E2', borderColor: colors.danger },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{authError}</Text>
          </View>
        )}

        {/* Primary Action: Google OAuth Sign-in */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.cardHeader, { color: colors.text }]}>
            Authentication
          </Text>
          <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
            Sign in with your enterprise Google account to access your plantation role.
          </Text>

          <TouchableOpacity
            style={[
              styles.googleButton,
              {
                backgroundColor: isDark ? '#26382C' : '#F0FDF4',
                borderColor: isDark ? colors.primaryLight : colors.primary,
              },
              isLoading && styles.buttonDisabled,
            ]}
            disabled={isLoading}
            onPress={handleGoogleSignInPress}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                <Text style={[styles.googleButtonText, { color: colors.text }]}>
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!isFirebaseReady && (
            <Text style={[styles.helperNote, { color: colors.accent }]}>
              <Ionicons name="information-circle-outline" size={14} /> Firebase credentials pending in .env. Use Instant Evaluation below to test in Expo Go immediately.
            </Text>
          )}
        </View>

        {/* Instant Evaluation / Demo Bypass for Expo Go */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              marginTop: 16,
            },
          ]}
        >
          <View style={styles.demoHeader}>
            <Ionicons name="flask-outline" size={18} color={colors.accent} />
            <Text style={[styles.demoTitle, { color: colors.accent }]}>
              Instant Expo Go Evaluation
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
            Evaluate the role-gated navigation and farm context switcher right now without waiting for backend keys:
          </Text>

          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={[
                styles.roleTestButton,
                {
                  backgroundColor: isDark ? '#3D2506' : '#FEF3C7',
                  borderColor: isDark ? '#92400E' : '#F59E0B',
                },
              ]}
              onPress={() => signInDemoUser('admin')}
              accessibilityRole="button"
            >
              <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
              <Text style={[styles.roleTestText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                Login as Admin (6 Tabs)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleTestButton,
                {
                  backgroundColor: isDark ? '#063B2C' : '#D1FAE5',
                  borderColor: isDark ? '#065F46' : '#10B981',
                },
              ]}
              onPress={() => signInDemoUser('supervisor')}
              accessibilityRole="button"
            >
              <Ionicons name="person-circle-outline" size={16} color="#10B981" />
              <Text style={[styles.roleTestText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                Login as Supervisor (3 Tabs)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Offline-First Architecture • Multi-Tenant Firestore Ready
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helperNote: {
    fontSize: 12,
    marginTop: 12,
    lineHeight: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  demoButtonsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  roleTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleTestText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
