"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore } from "./config";
import { findPublicProfileByUsername } from "./games";
import type { PublicProfile } from "@/types/user";

/** Social layer: friends, direct messages, forums, clubs, tournaments. */

// ---------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface Friendship {
  id: string;
  memberIds: string[];
  memberNames: string[];
  createdAt: string;
}

/** Send a request by username; returns an error message when we can't. */
export async function sendFriendRequest(
  me: { uid: string; username: string },
  username: string
): Promise<string | null> {
  const target = await findPublicProfileByUsername(username.trim());
  if (!target) return "No player with that username.";
  if (target.uid === me.uid) return "You cannot add yourself.";

  const existing = await getDocs(
    query(
      collection(firestore, "friendRequests"),
      where("fromUserId", "==", me.uid),
      where("toUserId", "==", target.uid),
      limit(1)
    )
  );
  if (!existing.empty) return "Request already sent.";

  await addDoc(collection(firestore, "friendRequests"), {
    fromUserId: me.uid,
    fromUsername: me.username,
    toUserId: target.uid,
    toUsername: target.username,
    status: "pending",
    createdAt: new Date().toISOString(),
    createdAtServer: serverTimestamp(),
  });

  return null;
}

export async function fetchIncomingRequests(
  uid: string
): Promise<FriendRequest[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "friendRequests"),
      where("toUserId", "==", uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as FriendRequest);
}

export async function fetchOutgoingRequests(
  uid: string
): Promise<FriendRequest[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "friendRequests"),
      where("fromUserId", "==", uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as FriendRequest);
}

export async function respondToFriendRequest(
  request: FriendRequest,
  accept: boolean,
  me: { uid: string; username: string }
): Promise<void> {
  await updateDoc(doc(firestore, "friendRequests", request.id), {
    status: accept ? "accepted" : "declined",
  });

  if (!accept) return;

  const memberIds = [request.fromUserId, request.toUserId].sort();
  const memberNames =
    request.fromUserId === me.uid
      ? [me.username, request.toUsername]
      : [request.fromUsername, me.username];

  await setDoc(doc(firestore, "friendships", memberIds.join("_")), {
    memberIds,
    memberNames,
    createdAt: new Date().toISOString(),
  });
}

export async function fetchFriends(uid: string): Promise<Friendship[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "friendships"),
      where("memberIds", "array-contains", uid)
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as Friendship);
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await deleteDoc(doc(firestore, "friendships", friendshipId));
}

/** Public profiles for a list of uids (used by friends/messages). */
export async function fetchPublicProfiles(
  uids: string[]
): Promise<Record<string, PublicProfile>> {
  const entries = await Promise.all(
    uids.map(async (uid) => {
      const snap = await getDoc(doc(firestore, "publicProfiles", uid));
      return [uid, snap.exists() ? (snap.data() as PublicProfile) : null] as const;
    })
  );
  const map: Record<string, PublicProfile> = {};
  for (const [uid, profile] of entries) {
    if (profile) map[uid] = profile;
  }
  return map;
}

// ---------------------------------------------------------------------
// Direct messages
// ---------------------------------------------------------------------

export interface Conversation {
  id: string;
  memberIds: string[];
  memberNames: string[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export async function fetchConversations(uid: string): Promise<Conversation[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "conversations"),
      where("memberIds", "array-contains", uid),
      orderBy("lastMessageAt", "desc"),
      limit(30)
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as Conversation);
}

/** Find (or create) the 1:1 conversation with another player. */
export async function openConversation(
  me: { uid: string; username: string },
  other: { uid: string; username: string }
): Promise<string> {
  const conversationId = [me.uid, other.uid].sort().join("_");
  const ref = doc(firestore, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const first = me.uid < other.uid ? me : other;
    const second = me.uid < other.uid ? other : me;
    await setDoc(ref, {
      memberIds: [first.uid, second.uid],
      memberNames: [first.username, second.username],
      lastMessage: "",
      lastMessageAt: new Date().toISOString(),
    });
  }

  return conversationId;
}

export function subscribeConversation(
  conversationId: string,
  onChange: (conversation: Conversation | null) => void
): () => void {
  return onSnapshot(doc(firestore, "conversations", conversationId), (snap) => {
    onChange(
      snap.exists() ? ({ ...snap.data(), id: snap.id } as Conversation) : null
    );
  });
}

export function subscribeMessages(
  conversationId: string,
  onChange: (messages: DirectMessage[]) => void
): () => void {
  return onSnapshot(
    query(
      collection(firestore, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    ),
    (snap) => {
      onChange(
        snap.docs.map(
          (row) => ({ ...row.data(), id: row.id }) as DirectMessage
        )
      );
    }
  );
}

export async function sendDirectMessage(
  conversationId: string,
  me: { uid: string; username: string },
  text: string
): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(
    collection(firestore, "conversations", conversationId, "messages"),
    {
      senderId: me.uid,
      senderName: me.username,
      text: text.slice(0, 1000),
      createdAt: now,
    }
  );
  await updateDoc(doc(firestore, "conversations", conversationId), {
    lastMessage: text.slice(0, 120),
    lastMessageAt: now,
  });
}

// ---------------------------------------------------------------------
// Forums
// ---------------------------------------------------------------------

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
}

/** Shipped with the app so the forum is usable before seeding. */
export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: "general",
    name: "General chess",
    description: "Anything and everything about chess.",
  },
  {
    id: "improvement",
    name: "Improvement",
    description: "Training plans, study advice and rating goals.",
  },
  {
    id: "openings",
    name: "Openings",
    description: "Theory, repertoire questions and favourite lines.",
  },
  {
    id: "game-analysis",
    name: "Game analysis",
    description: "Post a game and get feedback from other players.",
  },
];

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  replyCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface ForumReply {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export async function fetchTopics(categoryId: string): Promise<ForumTopic[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "forumTopics"),
      where("categoryId", "==", categoryId),
      orderBy("lastActivityAt", "desc"),
      limit(50)
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as ForumTopic);
}

export async function createTopic(input: {
  categoryId: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const created = await addDoc(collection(firestore, "forumTopics"), {
    ...input,
    title: input.title.slice(0, 140),
    body: input.body.slice(0, 5000),
    replyCount: 0,
    createdAt: now,
    lastActivityAt: now,
  });
  return created.id;
}

export async function fetchTopic(topicId: string): Promise<ForumTopic | null> {
  const snap = await getDoc(doc(firestore, "forumTopics", topicId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as ForumTopic) : null;
}

export async function fetchReplies(topicId: string): Promise<ForumReply[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "forumTopics", topicId, "replies"),
      orderBy("createdAt", "asc"),
      limit(200)
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as ForumReply);
}

export async function createReply(
  topicId: string,
  reply: Omit<ForumReply, "id" | "createdAt">
): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(firestore, "forumTopics", topicId, "replies"), {
    ...reply,
    body: reply.body.slice(0, 5000),
    createdAt: now,
  });
  await updateDoc(doc(firestore, "forumTopics", topicId), {
    lastActivityAt: now,
  });
}

// ---------------------------------------------------------------------
// Clubs
// ---------------------------------------------------------------------

export interface Club {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  memberNames: string[];
  adminIds: string[];
  createdAt: string;
}

export async function fetchClubs(): Promise<Club[]> {
  const snap = await getDocs(
    query(collection(firestore, "clubs"), limit(50))
  );
  const clubs = snap.docs.map((row) => ({ ...row.data(), id: row.id }) as Club);
  return clubs.sort((a, b) => b.memberIds.length - a.memberIds.length);
}

export async function createClub(input: {
  name: string;
  description: string;
  uid: string;
  username: string;
}): Promise<string> {
  const created = await addDoc(collection(firestore, "clubs"), {
    name: input.name.slice(0, 60),
    description: input.description.slice(0, 400),
    memberIds: [input.uid],
    memberNames: [input.username],
    adminIds: [input.uid],
    createdAt: new Date().toISOString(),
  });
  return created.id;
}

export async function fetchClub(clubId: string): Promise<Club | null> {
  const snap = await getDoc(doc(firestore, "clubs", clubId));
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as Club) : null;
}

export async function toggleClubMembership(
  club: Club,
  me: { uid: string; username: string }
): Promise<boolean> {
  const isMember = club.memberIds.includes(me.uid);
  const memberIds = isMember
    ? club.memberIds.filter((uid) => uid !== me.uid)
    : [...club.memberIds, me.uid];
  const memberNames = isMember
    ? club.memberNames.filter((name) => name !== me.username)
    : [...club.memberNames, me.username];

  await updateDoc(doc(firestore, "clubs", club.id), { memberIds, memberNames });
  return !isMember;
}

export interface ClubPost {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export async function fetchClubPosts(clubId: string): Promise<ClubPost[]> {
  const snap = await getDocs(
    query(
      collection(firestore, "clubs", clubId, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    )
  );
  return snap.docs.map((row) => ({ ...row.data(), id: row.id }) as ClubPost);
}

export async function createClubPost(
  clubId: string,
  post: Omit<ClubPost, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(firestore, "clubs", clubId, "posts"), {
    ...post,
    body: post.body.slice(0, 2000),
    createdAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------
// Tournaments (arena-style, played as normal rated games)
// ---------------------------------------------------------------------

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: "arena" | "swiss";
  timeControlSeconds: number;
  status: "upcoming" | "running" | "finished";
  organizerIds: string[];
  playerIds: string[];
  playerNames: string[];
  startAt: string;
  createdAt: string;
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const snap = await getDocs(
    query(collection(firestore, "tournaments"), limit(50))
  );
  const rows = snap.docs.map(
    (row) => ({ ...row.data(), id: row.id }) as Tournament
  );
  return rows.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
}

export async function fetchTournament(
  tournamentId: string
): Promise<Tournament | null> {
  const snap = await getDoc(doc(firestore, "tournaments", tournamentId));
  return snap.exists()
    ? ({ ...snap.data(), id: snap.id } as Tournament)
    : null;
}

export async function createTournament(input: {
  name: string;
  description: string;
  format: Tournament["format"];
  timeControlSeconds: number;
  startAt: string;
  uid: string;
  username: string;
}): Promise<string> {
  const created = await addDoc(collection(firestore, "tournaments"), {
    name: input.name.slice(0, 80),
    description: input.description.slice(0, 500),
    format: input.format,
    timeControlSeconds: input.timeControlSeconds,
    status: "upcoming",
    organizerIds: [input.uid],
    playerIds: [input.uid],
    playerNames: [input.username],
    startAt: input.startAt,
    createdAt: new Date().toISOString(),
  });
  return created.id;
}

export async function toggleTournamentRegistration(
  tournament: Tournament,
  me: { uid: string; username: string }
): Promise<boolean> {
  const isPlaying = tournament.playerIds.includes(me.uid);
  const playerIds = isPlaying
    ? tournament.playerIds.filter((uid) => uid !== me.uid)
    : [...tournament.playerIds, me.uid];
  const playerNames = isPlaying
    ? tournament.playerNames.filter((name) => name !== me.username)
    : [...tournament.playerNames, me.username];

  await updateDoc(doc(firestore, "tournaments", tournament.id), {
    playerIds,
    playerNames,
  });
  return !isPlaying;
}



