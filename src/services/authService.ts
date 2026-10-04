import {
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import { getUserProfile, saveUserProfile } from './userService';
import { UserProfile, UserRole } from '../types/auth';

/**
 * Signs in using a Google ID token via Firebase Auth
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured. Please supply valid credentials in your .env file.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  // Retrieve user profile with role and orgId from Firestore
  let profile = await getUserProfile(user.uid);

  // If new user signing in for the first time without an existing profile,
  // bootstrap default profile with 'supervisor' role (or 'admin' if first user in org)
  if (!profile) {
    profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'supervisor', // Safe default role
      orgId: 'plantation_default_org',
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
  }

  return profile;
}

/**
 * Signs out the current user
 */
export async function signOutUser(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

/**
 * Listens to Firebase Auth state changes
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
