"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiSend } from "react-icons/fi";
import {
  sendChatMessage,
  subscribeChat,
  type ChatMessage,
} from "@/lib/online/liveGames";

export function GameChat({
  gameId,
  uid,
  name,
}: {
  gameId: string;
  uid: string | null;
  name: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeChat(gameId, setMessages);
    return unsubscribe;
  }, [gameId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !uid) return;

    setSending(true);
    try {
      await sendChatMessage(gameId, {
        senderId: uid,
        senderName: name,
        text: text.slice(0, 300),
        at: Date.now(),
      });
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-3 flex flex-col">
      <h2 className="text-sm font-semibold text-text-primary mb-2">Chat</h2>

      <div
        ref={scrollRef}
        className="flex-1 max-h-56 overflow-y-auto space-y-2 text-sm pr-1"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-text-secondary">
            Say hello — messages are visible to both players and spectators.
          </p>
        ) : (
          messages.map((message) => (
            <p key={message.id} className="text-text-primary break-words">
              <span
                className={`font-semibold ${
                  message.senderId === uid
                    ? "text-accent-primary"
                    : "text-accent-link"
                }`}
              >
                {message.senderName}:
              </span>{" "}
              {message.text}
            </p>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          maxLength={300}
          className="flex-1 bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim() || !uid}
          className="p-2 rounded-lg bg-accent-primary text-bg-primary disabled:opacity-50"
          aria-label="Send message"
        >
          <FiSend size={16} />
        </button>
      </form>
    </div>
  );
}
