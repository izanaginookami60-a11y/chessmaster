export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface UserStats {
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string | null;
  country: string | null; // ISO 3166-1 alpha-2 code, e.g. "MY"
  skillLevel: SkillLevel | null;
  photoURL: string | null;
  isAnonymous: boolean;
  isVerified: boolean; // email verified
  isAdmin: boolean;
  rating: number;
  ratingBullet: number;
  ratingBlitz: number;
  ratingRapid: number;
  ratingPuzzle: number;
  ratingBulletGames?: number;
  ratingBlitzGames?: number;
  ratingRapidGames?: number;
  stats?: UserStats;
  lastGameAt?: string;
  createdAt: string; // ISO timestamp
  profileSetupComplete: boolean;
}

/**
 * Public mirror of a user profile (kept in /publicProfiles/{uid} by a
 * Cloud Function so emails never leave the private document).
 */
export interface PublicProfile {
  uid: string;
  username: string;
  country?: string | null;
  skillLevel?: SkillLevel | null;
  photoURL?: string | null;
  rating?: number;
  ratingBullet?: number;
  ratingBlitz?: number;
  ratingRapid?: number;
  ratingPuzzle?: number;
  stats?: UserStats;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_RATING = 1200;

export function createDefaultProfile(params: {
  uid: string;
  username: string;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}): UserProfile {
  return {
    uid: params.uid,
    username: params.username,
    email: params.email,
    country: null,
    skillLevel: null,
    photoURL: params.photoURL,
    isAnonymous: params.isAnonymous,
    isVerified: false,
    isAdmin: false,
    rating: DEFAULT_RATING,
    ratingBullet: DEFAULT_RATING,
    ratingBlitz: DEFAULT_RATING,
    ratingRapid: DEFAULT_RATING,
    ratingPuzzle: DEFAULT_RATING,
    createdAt: new Date().toISOString(),
    profileSetupComplete: false,
  };
}
