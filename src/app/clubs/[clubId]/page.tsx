"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiArrowLeft, FiUserPlus, FiUserMinus } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  createClubPost,
  fetchClub,
  fetchClubPosts,
  toggleClubMembership,
  type Club,
  type ClubPost,
} from "@/lib/firebase/social";

export default function ClubPage() {
  const params = useParams<{ clubId: string }>();
  const { firebaseUser, profile } = useAuth();
  const [club, setClub] = useState<Club | null | "missing">(null);
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const clubId = params.clubId;

  useEffect(() => {
    let cancelled = false;

    fetchClub(clubId)
      .then(async (found) => {
        if (cancelled) return;
        if (!found) {
          setClub("missing");
          return;
        }
        setClub(found);
        const rows = await fetchClubPosts(clubId).catch(() => []);
        if (!cancelled) setPosts(rows);
      })
      .catch(() => {
        if (!cancelled) setClub("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [clubId, refreshKey]);

  async function handleMembership() {
    if (!firebaseUser || !profile || !club || club === "missing") {
      toast.error("Log in to join a club.");
      return;
    }
    setBusy(true);
    try {
      const joined = await toggleClubMembership(club, {
        uid: firebaseUser.uid,
        username: profile.username,
      });
      toast.success(joined ? "Joined the club." : "Left the club.");
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Could not update your membership.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) {
      toast.error("Log in to post.");
      return;
    }
    setBusy(true);
    try {
      await createClubPost(clubId, {
        authorId: firebaseUser.uid,
        authorName: profile.username,
        body,
      });
      setBody("");
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Could not post that message.");
    } finally {
      setBusy(false);
    }
  }

  if (club === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Spinner label="Loading club…" />
      </div>
    );
  }

  if (club === "missing") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Club not found"
          action={
            <Link
              href="/clubs"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              All clubs
            </Link>
          }
        />
      </div>
    );
  }

  const isMember = firebaseUser
    ? club.memberIds.includes(firebaseUser.uid)
    : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title={club.name}
        description={`${club.memberIds.length} members · ${
          club.description || "No description"
        }`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/clubs"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              <FiArrowLeft size={12} /> Clubs
            </Link>
            <button
              onClick={() => void handleMembership()}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 ${
                isMember
                  ? "bg-bg-secondary text-result-loss hover:bg-bg-hover"
                  : "bg-accent-primary text-bg-primary"
              }`}
            >
              {isMember ? (
                <>
                  <FiUserMinus size={13} /> Leave
                </>
              ) : (
                <>
                  <FiUserPlus size={13} /> Join
                </>
              )}
            </button>
          </div>
        }
      />

      <section className="bg-bg-secondary rounded-xl p-5 mb-6">
        <SectionTitle>Members</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {club.memberNames.map((name, index) => (
            <Link
              key={`${name}-${index}`}
              href={`/profile/${name}`}
              className="text-xs bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-1.5 rounded-full"
            >
              {name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Club board</SectionTitle>

        {isMember && (
          <form
            onSubmit={handlePost}
            className="bg-bg-secondary rounded-xl p-4 mb-4"
          >
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              required
              placeholder="Post an announcement or start a discussion"
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2"
            />
            <button
              type="submit"
              disabled={busy || !body.trim()}
              className="text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg disabled:opacity-50"
            >
              Post
            </button>
          </form>
        )}

        {posts.length === 0 ? (
          <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
            Nothing posted yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="bg-bg-secondary rounded-xl p-4">
                <p className="text-xs text-text-muted mb-1">
                  {post.authorName} ·{" "}
                  {new Date(post.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {post.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
