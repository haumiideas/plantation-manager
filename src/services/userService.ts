import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { UserProfile } from '../types/auth';

const USERS_COLLECTION = 'users';

/**
 * Fetches user profile document from Firestore (/users/{uid})
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(userDocRef);

    if (snapshot.exists()) {
      return snapshot.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[userService] Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Creates or updates user profile in Firestore (/users/{uid})
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, profile.uid);
    await setDoc(
      userDocRef,
      {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[userService] Error saving user profile:', error);
    throw error;
  }
}
