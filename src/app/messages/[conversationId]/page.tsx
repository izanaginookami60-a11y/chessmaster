"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  sendDirectMessage,
  subscribeConversation,
  subscribeMessages,
  type Conversation,
  type DirectMessage,
} from "@/lib/firebase/social";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const { firebaseUser, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationId = params.conversationId;

  useEffect(() => {
    const unsubscribe = subscribeConversation(conversationId, setConversation);
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    const unsubscribe = subscribeMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !profile) return;
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    try {
      await sendDirectMessage(
        conversationId,
        { uid: firebaseUser.uid, username: profile.username },
        text
      );
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          title="Log in to read your messages"
          action={
            <Link
              href="/login?redirect=/messages"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              Log in
            </Link>
          }
        />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Spinner label="Opening conversation…" />
      </div>
    );
  }

  const index = conversation.memberIds.findIndex(
    (member) => member !== firebaseUser.uid
  );
  const otherName = conversation.memberNames[index] ?? "Player";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col min-h-[70vh]">
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          <FiArrowLeft size={13} /> Inbox
        </Link>
        <h1 className="text-lg font-semibold text-text-primary">
          {otherName}
        </h1>
      </div>

      <div className="flex-1 bg-bg-secondary rounded-xl p-4 overflow-y-auto max-h-[60vh] space-y-3">
        {messages.length === 0 ? (
          <p className="text-xs text-text-secondary">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === firebaseUser.uid;
            return (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  mine
                    ? "ml-auto bg-accent-primary text-bg-primary"
                    : "bg-bg-primary text-text-primary"
                }`}
              >
                <p className="break-words">{message.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    mine ? "text-bg-primary/70" : "text-text-muted"
                  }`}
                >
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 mt-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message"
          maxLength={1000}
          className="flex-1 bg-bg-secondary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="p-2.5 rounded-lg bg-accent-primary text-bg-primary disabled:opacity-50"
          aria-label="Send message"
        >
          <FiSend size={16} />
        </button>
      </form>
    </div>
  );
}
