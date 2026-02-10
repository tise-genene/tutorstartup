"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND_NAME, STORAGE_PREFIX, SUPPORT_EMAIL } from "../../lib/brand";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const STORAGE_SEEN_KEY = `${STORAGE_PREFIX}.chat.seen`;

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function nextId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getBotReply(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("register") || text.includes("sign up")) {
    return "If you’re registering and not getting a verification email, check your spam folder and try ‘Resend verification’ on the login page.";
  }

  if (text.includes("login") || text.includes("log in")) {
    return "If login fails, double-check your email/password. If you forgot your password, use ‘Forgot password’ to reset it.";
  }

  if (text.includes("profile") || text.includes("bio")) {
    return "To get discovered faster: add a clear bio, key skills, and your rate in your profile.";
  }

  if (text.includes("payment") || text.includes("pay")) {
    return "Payments are in beta. If something looks off, share the contract ID and we’ll investigate.";
  }

  return "Got it. Tell me what you’re trying to do and what went wrong, and I’ll help you troubleshoot.";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [seen, setSeen] = useState(true);
  const [nudge, setNudge] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: nextId(),
      role: "bot",
      text: `Hi — need help? Ask me anything about using ${BRAND_NAME}.`,
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fixed effect (no synchronous cascading state updates)
  useEffect(() => {
    try {
      const value = localStorage.getItem(STORAGE_SEEN_KEY);
      const hasSeen = value === "1";

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeen(hasSeen);

      if (!hasSeen) {
        const start = window.setTimeout(() => setNudge(true), 0);
        const timeout = window.setTimeout(() => setNudge(false), 20_000);

        return () => {
          window.clearTimeout(start);
          window.clearTimeout(timeout);
        };
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, messages.length]);

  const showAttention = useMemo(() => {
    return !open && !seen;
  }, [open, seen]);

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setSeen(true);
    setNudge(false);
  };

  const onToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markSeen();
      return next;
    });
  };

  const onSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      text: trimmed,
    };

    setDraft("");
    setMessages((prev) => [...prev, userMessage]);

    const reply = getBotReply(trimmed);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "bot", text: reply },
      ]);
    }, 450);
  };

  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 70 }}>
      {open && (
        <div
          className="glass-panel"
          style={{
            width: 360,
            maxWidth: "calc(100vw - 36px)",
            maxHeight: "min(70vh, 540px)",
            overflow: "hidden",
            marginBottom: 12,
          }}
          role="dialog"
          aria-label="Chat"
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3"
            style={{ borderColor: "var(--divider)" }}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{BRAND_NAME} chat</p>
              <p className="text-xs ui-muted">Quick help and troubleshooting</p>
            </div>

            <button
              type="button"
              className="ui-btn ui-icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>

          <div
            ref={listRef}
            className="px-4 py-3"
            style={{
              overflowY: "auto",
              maxHeight: "min(52vh, 380px)",
            }}
          >
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className="max-w-[85%] rounded-2xl border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--divider)",
                      background:
                        m.role === "user"
                          ? "var(--accent)"
                          : "var(--panel-surface)",
                      color:
                        m.role === "user"
                          ? "var(--background)"
                          : "var(--foreground)",
                      boxShadow: "var(--tile-shadow)",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="border-t px-4 py-3"
            style={{ borderColor: "var(--divider)" }}
          >
            <div className="flex items-center gap-2">
              <input
                className="ui-field"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                onClick={onSend}
                disabled={!draft.trim()}
                style={{ opacity: draft.trim() ? 1 : 0.7 }}
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-xs ui-muted">
              For account issues, email {SUPPORT_EMAIL}.
            </p>
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-end gap-3">
        {nudge && !open && (
          <div
            className="hidden sm:block rounded-2xl border px-3 py-2 text-xs"
            style={{
              borderColor: "var(--divider)",
              background: "var(--panel-surface)",
              boxShadow: "var(--tile-shadow)",
            }}
          >
            <span className="font-semibold">Need help?</span>
            <span className="ml-1 ui-muted">Chat with us</span>
          </div>
        )}

        <button
          type="button"
          className="ui-btn ui-btn-primary ui-icon-btn relative"
          onClick={onToggle}
          aria-label={open ? "Close chat" : "Open chat"}
        >
          <ChatIcon />

          {showAttention && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 14,
                height: 14,
              }}
            >
              <span
                className="absolute inset-0 animate-ping rounded-full"
                style={{
                  background: "var(--accent-glow)",
                  opacity: 0.65,
                }}
              />
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: "var(--accent-glow)",
                  boxShadow: "0 0 12px var(--accent-glow)",
                }}
              />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
