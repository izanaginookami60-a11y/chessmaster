import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  linkWithPopup,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, firestore } from "./config";
import { createDefaultProfile, type UserProfile } from "@/types/user";

const googleProvider = new GoogleAuthProvider();

/**
 * Register a new user with email/password, set their display name,
 * create a matching Firestore profile document, and fire off an
 * email verification message.
 */
export async function registerWithEmail(params: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const { username, email, password } = params;

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });

  const profile = createDefaultProfile({
    uid: cred.user.uid,
    username,
    email: cred.user.email,
    photoURL: cred.user.photoURL,
    isAnonymous: false,
  });

  await setDoc(doc(firestore, "users", cred.user.uid), profile);
  await sendEmailVerification(cred.user);

  return cred.user;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Google sign-in. If this is the first time we've seen this uid,
 * create a Firestore profile for them too.
 */
export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);

  const profileRef = doc(firestore, "users", cred.user.uid);
  const existing = await getDoc(profileRef);

  if (!existing.exists()) {
    const profile = createDefaultProfile({
      uid: cred.user.uid,
      username: cred.user.displayName ?? `player_${cred.user.uid.slice(0, 6)}`,
      email: cred.user.email,
      photoURL: cred.user.photoURL,
      isAnonymous: false,
    });
    // Google accounts come pre-verified
    profile.isVerified = true;
    await setDoc(profileRef, profile);
  }

  return cred.user;
}

/**
 * Guest play: anonymous auth, no Firestore profile, no rating persistence.
 * Callers should treat firebaseUser.isAnonymous === true as "guest mode".
 */
export async function loginAsGuest(): Promise<User> {
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/**
 * Upgrade an anonymous/guest session into a real account, preserving
 * the same uid (so any local game history tied to that uid carries over).
 */
export async function upgradeGuestWithGoogle(): Promise<User> {
  if (!auth.currentUser) {
    throw new Error("No active session to upgrade.");
  }
  const cred = await linkWithPopup(auth.currentUser, googleProvider);

  const profile = createDefaultProfile({
    uid: cred.user.uid,
    username: cred.user.displayName ?? `player_${cred.user.uid.slice(0, 6)}`,
    email: cred.user.email,
    photoURL: cred.user.photoURL,
    isAnonymous: false,
  });
  profile.isVerified = true;
  await setDoc(doc(firestore, "users", cred.user.uid), profile);

  return cred.user;
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("No signed-in user.");
  }
  await sendEmailVerification(auth.currentUser);
}

export async function fetchUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(firestore, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
