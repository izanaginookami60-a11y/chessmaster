"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiUserPlus, FiMessageSquare, FiTrash2, FiWifi } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  openConversation,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
  type FriendRequest,
  type Friendship,
} from "@/lib/firebase/social";
import { subscribePresence } from "@/lib/online/liveGames";

export default function FriendsPage() {
  const router = useRouter();
  const { firebaseUser, profile, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    let cancelled = false;

    if (!uid) return;

    Promise.all([
      fetchIncomingRequests(uid).catch(() => []),
      fetchOutgoingRequests(uid).catch(() => []),
      fetchFriends(uid).catch(() => []),
    ])
      .then(([inbox, sent, list]) => {
        if (cancelled) return;
        setIncoming(inbox);
        setOutgoing(sent);
        setFriends(list);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uid, refreshKey]);

  // Presence for each friend (one subscription per friend).
  useEffect(() => {
    if (friends.length === 0 || !uid) return;

    const unsubscribes = friends
      .map((friendship) =>
        friendship.memberIds.find((member) => member !== uid)
      )
      .filter((friendId): friendId is string => !!friendId)
      .map((friendId) =>
        subscribePresence(friendId, (state) => {
          setOnlineIds((current) => {
            const isOnline = !!state?.online;
            if (isOnline) {
              return current.includes(friendId)
                ? current
                : [...current, friendId];
            }
            return current.filter((id) => id !== friendId);
          });
        })
      );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [friends, uid]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) return;
    setBusy(true);
    const error = await sendFriendRequest(
      { uid: firebaseUser.uid, username: profile.username },
      username
    );
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setUsername("");
    toast.success("Request sent.");
    setRefreshKey((key) => key + 1);
  }

  async function handleRespond(request: FriendRequest, accept: boolean) {
    if (!profile) return;
    await respondToFriendRequest(request, accept, {
      uid: request.toUserId,
      username: profile.username,
    });
    toast.success(accept ? "Friend added." : "Request declined.");
    setRefreshKey((key) => key + 1);
  }

  async function handleMessage(friendship: Friendship) {
    if (!firebaseUser || !profile) return;
    const otherId = friendship.memberIds.find(
      (member) => member !== firebaseUser.uid
    );
    const otherName = friendship.memberNames.find(
      (name) => name !== profile.username
    );
    if (!otherId || !otherName) return;

    const conversationId = await openConversation(
      { uid: firebaseUser.uid, username: profile.username },
      { uid: otherId, username: otherName }
    );
    router.push(`/messages/${conversationId}`);
  }

  if (!uid) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader title="Friends" />
        <EmptyState
          title={isLoading ? "Loading…" : "Log in to manage your friends"}
          action={
            !isLoading ? (
              <Link
                href="/login?redirect=/friends"
                className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Friends"
        description="Add players by username, accept requests and see who is online."
      />

      <form onSubmit={handleSend} className="flex gap-2 mb-8">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Add a friend by username"
          className="flex-1 bg-bg-secondary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="submit"
          disabled={busy || !username.trim()}
          className="inline-flex items-center gap-1.5 bg-accent-primary text-bg-primary font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          <FiUserPlus size={14} /> Add
        </button>
      </form>

      {!loaded ? (
        <Spinner label="Loading friends…" />
      ) : (
        <>
          <section className="mb-8">
            <SectionTitle>Requests ({incoming.length})</SectionTitle>
            {incoming.length === 0 ? (
              <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
                No pending requests.
              </p>
            ) : (
              <ul className="space-y-2">
                {incoming.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center gap-3 bg-bg-secondary rounded-lg px-4 py-3 text-sm"
                  >
                    <span className="text-text-primary flex-1">
                      {request.fromUsername}
                    </span>
                    <button
                      onClick={() => void handleRespond(request, true)}
                      className="text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-1.5 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => void handleRespond(request, false)}
                      className="text-xs font-medium text-text-secondary hover:text-text-primary"
                    >
                      Decline
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-8">
            <SectionTitle>Your friends ({friends.length})</SectionTitle>
            {friends.length === 0 ? (
              <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
                No friends yet — send a request above.
              </p>
            ) : (
              <ul className="space-y-2">
                {friends.map((friendship) => {
                  const otherId = friendship.memberIds.find(
                    (member) => member !== uid
                  );
                  const otherName = friendship.memberNames.find(
                    (name) => name !== profile?.username
                  );
                  const online = otherId ? onlineIds.includes(otherId) : false;

                  return (
                    <li
                      key={friendship.id}
                      className="flex items-center gap-3 bg-bg-secondary rounded-lg px-4 py-3"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          online ? "bg-result-win" : "bg-text-muted"
                        }`}
                        title={online ? "online" : "offline"}
                      />
                      <Link
                        href={`/profile/${otherName}`}
                        className="text-sm text-text-primary hover:text-accent-link flex-1 truncate"
                      >
                        {otherName}
                      </Link>
                      {online && <FiWifi size={13} className="text-result-win" />}
                      <button
                        onClick={() => void handleMessage(friendship)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
                        aria-label="Message friend"
                      >
                        <FiMessageSquare size={15} />
                      </button>
                      <button
                        onClick={() =>
                          void removeFriend(friendship.id).then(() => {
                            toast.success("Friend removed.");
                            setRefreshKey((key) => key + 1);
                          })
                        }
                        className="p-1.5 rounded-lg text-text-secondary hover:text-result-loss"
                        aria-label="Remove friend"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {outgoing.length > 0 && (
            <section>
              <SectionTitle>Sent requests</SectionTitle>
              <ul className="space-y-2">
                {outgoing.map((request) => (
                  <li
                    key={request.id}
                    className="bg-bg-secondary rounded-lg px-4 py-3 text-sm text-text-secondary"
                  >
                    Waiting for {request.toUsername} to respond…
                  </li>
                ))}
              </ul>
            </section>
          )}

        </>
      )}
    </div>
  );
}
