import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types/auth';
import { isFirebaseConfigured } from '../config/firebase';
import {
  subscribeToAuthState,
  signOutUser,
  signInWithGoogleIdToken,
} from '../services/authService';
import { getUserProfile, saveUserProfile } from '../services/userService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  orgId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isFirebaseReady: boolean;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Immediate testing bypass for Expo Go without backend configuration
  signInDemoUser: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const DEMO_USER_STORAGE_KEY = '@plantation_demo_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuthSession = async () => {
      setIsLoading(true);
      try {
        if (isFirebaseConfigured) {
          // Listen to Firebase Auth state
          unsubscribe = subscribeToAuthState(async (firebaseUser) => {
            if (firebaseUser) {
              try {
                let profile = await getUserProfile(firebaseUser.uid);
                if (!profile) {
                  // Provision initial profile document
                  profile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || 'Plantation User',
                    photoURL: firebaseUser.photoURL,
                    role: 'supervisor',
                    orgId: 'plantation_org_namari_adukidathan',
                    createdAt: new Date().toISOString(),
                  };
                  await saveUserProfile(profile);
                }
                setUser(profile);
              } catch (profileErr) {
                console.error('Failed to load profile from Firestore:', profileErr);
                setError('Failed to load user profile from Firestore.');
              }
            } else {
              setUser(null);
            }
            setIsLoading(false);
          });
        } else {
          // Firebase not configured yet: check for stored demo session
          const savedDemo = await AsyncStorage.getItem(DEMO_USER_STORAGE_KEY);
          if (savedDemo) {
            setUser(JSON.parse(savedDemo));
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setIsLoading(false);
      }
    };

    initializeAuthSession();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await signInWithGoogleIdToken(idToken);
      setUser(profile);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Google Sign-In failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured) {
        await signOutUser();
      }
      await AsyncStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Immediate Testing Helper for Expo Go
  const signInDemoUser = async (selectedRole: UserRole) => {
    setIsLoading(true);
    const demoProfile: UserProfile = {
      uid: selectedRole === 'admin' ? 'demo_admin_001' : 'demo_supervisor_002',
      email: selectedRole === 'admin' ? 'admin@plantation.local' : 'supervisor@plantation.local',
      displayName: selectedRole === 'admin' ? 'Johnny (Admin)' : 'Ravi (Supervisor)',
      role: selectedRole,
      orgId: 'plantation_org_namari_adukidathan',
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoProfile));
    setUser(demoProfile);
    setIsLoading(false);
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return;
    const updatedProfile: UserProfile = {
      ...user,
      role: newRole,
      displayName: newRole === 'admin' ? 'Johnny (Admin)' : 'Ravi (Supervisor)',
    };
    await AsyncStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(updatedProfile));
    setUser(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        orgId: user?.orgId || null,
        isLoading,
        isAuthenticated: Boolean(user),
        error,
        isFirebaseReady: isFirebaseConfigured,
        signInWithGoogle,
        signOut,
        signInDemoUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
