"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND_NAME, STORAGE_PREFIX, SUPPORT_EMAIL } from "../../lib/brand";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type MessageForAPI = {
  role: "user" | "assistant";
  content: string;
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

// Fallback rule-based reply for when AI is not available
function getBotReply(message: string): string {
  const text = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|hola|greetings|sup|yo)$/i.test(text) || text.includes("how are you")) {
    return "Hello! 👋 Welcome to Eagle Tutorials Services! I'm your assistant here to help you with tutoring services, tutor applications, or any questions about our programs. How can I help you today?";
  }

  // Identity/Bot questions
  if (text.includes("who are you") || text.includes("what are you") || text.includes("your name") || text.includes("bot")) {
    return "I'm the Eagle Tutorials Services assistant! 🦅 I help connect students with expert tutors in Addis Ababa. We offer personalized home tutoring for KG-12, university courses, and programming training. What would you like to know?";
  }

  // Eagle Tutorials introduction
  if (text.includes("eagle") || text.includes("about") || text.includes("company") || text.includes("what is") || text.includes("tell me about")) {
    return "Eagle Tutorials Services is a premier tutoring company based in Addis Ababa, Ethiopia. We connect expert tutors with students needing personalized education support. With 200+ qualified tutors and 1000+ successful sessions, we offer KG-12 tutoring, university courses, programming training, and exam prep. How can we help you?";
  }

  // Tutors
  if (text.includes("tutor") || text.includes("teacher") || text.includes("instructor")) {
    return "We have 200+ qualified tutors specializing in KG-12 subjects, university courses, and programming. Our tutors are experienced professionals like Genene Tise (coding), Eden Yohannes (young learners), and Bekalu Teketel (SAT/TOEFL prep). Contact us at info@eagletutorials.com or +251 932 508 910 to get matched!";
  }

  // Pricing & Commission
  if (text.includes("price") || text.includes("cost") || text.includes("fee") || text.includes("commission") || text.includes("how much") || text.includes("payment")) {
    return "💰 For tutors: We charge a one-time 50% commission of the first month's payment for job placement. For students: Pricing varies by subject, level, and format (home vs online). Contact us at info@eagletutorials.com or +251 932 508 910 for a personalized quote!";
  }

  // Refund Policy
  if (text.includes("refund") || text.includes("money back") || text.includes("return") || text.includes("cancel")) {
    return "💸 Our refund policy: If a parent discontinues within the first month, we offer a FULL commission refund OR a replacement job. For tutor-initiated cancellations, no refund unless there's a valid emergency (health, family). Replacement offers valid for 30 days. Contact us for details!";
  }

  // Become a tutor
  if (text.includes("become") || text.includes("apply") || text.includes("join") || text.includes("work") || text.includes("hire me")) {
    return "🎓 Want to join our team of 200+ tutors? Apply here: https://forms.gle/yRfe2JxqqhjY8kTD7 We offer job placement with a 50% one-time commission, ongoing support, and relationship monitoring. Whether you teach KG-12, university courses, or programming, we'd love to have you!";
  }

  // Services
  if (text.includes("service") || text.includes("offer") || text.includes("provide") || text.includes("what do you")) {
    return "📚 Our Services:\n1️⃣ KG-12 Home Tutoring (all subjects)\n2️⃣ University-Level Tutoring\n3️⃣ Programming & Coding Training\n4️⃣ Online Programming Courses\n5️⃣ SAT & TOEFL Exam Prep\n\nAll with personalized one-on-one attention! Which interests you?";
  }

  // Contact
  if (text.includes("contact") || text.includes("reach") || text.includes("phone") || text.includes("email") || text.includes("call") || text.includes("telegram")) {
    return "📞 Get in touch with us:\n📧 Email: info@eagletutorials.com\n📱 Phone: +251 932 508 910 or +251 914 731 746\n💬 Telegram: https://t.me/Eagle_Tutorials_Service\n📍 Location: Addis Ababa, Ethiopia\n\nWe'd love to hear from you!";
  }

  // Programming/Coding
  if (text.includes("programming") || text.includes("coding") || text.includes("computer") || text.includes("tech") || text.includes("developer")) {
    return "💻 Yes! We offer programming and coding training led by experienced developers like Genene Tise. Learn Python, JavaScript, web development, and more! We have hands-on sessions and online courses for beginners to advanced learners. Perfect for building in-demand tech skills!";
  }

  // Online/Virtual
  if (text.includes("online") || text.includes("virtual") || text.includes("remote") || text.includes("from home")) {
    return "🌐 Absolutely! We offer flexible online programming courses with live sessions and high-quality content. Learn from the comfort of your home with the same expert instruction as our in-person tutoring. Perfect for busy schedules or students outside Addis Ababa!";
  }

  // Exams (SAT/TOEFL)
  if (text.includes("sat") || text.includes("toefl") || text.includes("exam") || text.includes("test") || text.includes("prep") || text.includes("ielts")) {
    return "📝 Yes! We offer specialized SAT and TOEFL preparation with expert tutors like Bekalu Teketel. Our students achieve outstanding results with proven strategies, practice tests, and confidence-building techniques. Get the score you need for your university applications!";
  }

  // Kids/Children
  if (text.includes("kid") || text.includes("child") || text.includes("children") || text.includes("son") || text.includes("daughter")) {
    return "👨‍👩‍👧‍👦 We tutor students of all ages! For young learners, our tutors like Eden Yohannes specialize in making learning fun and engaging. We offer KG-12 tutoring in all subjects, with personalized attention to help your child excel. Contact us to find the perfect match!";
  }

  // Students
  if (text.includes("student") || text.includes("school") || text.includes("university") || text.includes("college")) {
    return "🎓 We serve all students! From KG-12 to university level, we have expert tutors for every stage. Whether you need help with math, science, programming, or exam prep, our 200+ qualified tutors are here to help you succeed academically!";
  }

  // Location
  if (text.includes("location") || text.includes("where") || text.includes("address") || text.includes("addis") || text.includes("ethiopia")) {
    return "📍 We're proudly based in Addis Ababa, Ethiopia! We provide local home tutoring throughout the city AND online courses serving students locally and internationally. Wherever you are, we can help you achieve academic excellence!";
  }

  // How it works / Process
  if (text.includes("how") && (text.includes("work") || text.includes("process") || text.includes("operate"))) {
    return "🔄 How we work:\n1️⃣ We match you with qualified tutors based on your needs\n2️⃣ Tutors pay 50% commission for job placement\n3️⃣ We monitor the tutor-student relationship\n4️⃣ We offer refunds or replacements if needed within 30 days\n\nIt's that simple! Ready to get started?";
  }

  // Help/Questions
  if (text.includes("help") || text.includes("question") || text.includes("?") || text.includes("assist")) {
    return "🤝 I'm here to help! I can answer questions about:\n• Our tutoring services\n• How to become a tutor\n• Pricing and commission\n• Refund policies\n• Contact information\n\nWhat would you like to know?";
  }

  // Thank you
  if (text.includes("thank") || text.includes("thanks") || text.includes("appreciate")) {
    return "You're very welcome! 😊 We're here whenever you need us. Feel free to reach out at info@eagletutorials.com or +251 932 508 910. Have a great day!";
  }

  // Goodbye
  if (text.includes("bye") || text.includes("goodbye") || text.includes("see you") || text.includes("later")) {
    return "Goodbye! 👋 Thank you for chatting with Eagle Tutorials Services. Remember, you can always reach us at info@eagletutorials.com or +251 932 508 910. Have a wonderful day!";
  }

  // Default response with more personality
  return "Thanks for reaching out! 🦅 I'm here to help with questions about:\n• Tutoring services (KG-12, university, programming)\n• Becoming a tutor\n• Pricing and policies\n• Or anything else!\n\n📧 info@eagletutorials.com\n📱 +251 932 508 910\n📝 Apply: https://forms.gle/yRfe2JxqqhjY8kTD7\n\nWhat can I help you with?";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [seen, setSeen] = useState(true);
  const [nudge, setNudge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: nextId(),
      role: "bot",
      text: `Hi — need help? Ask me anything about using ${BRAND_NAME}.`,
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  // Load seen preference from localStorage
  useEffect(() => {
    try {
      const value = localStorage.getItem(STORAGE_SEEN_KEY);
      const hasSeen = value === "1";
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

  const callAI = async (userText: string, currentMessages: ChatMessage[]) => {
    setIsLoading(true);
    
    // Add a temporary "thinking" message
    const tempId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "bot", text: "Thinking..." },
    ]);
    
    try {
      // Convert messages to API format (excluding the temp message)
      const apiMessages: MessageForAPI[] = currentMessages
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        }));
      
      // Add the new user message
      apiMessages.push({
        role: "user",
        content: userText,
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let hasReceivedContent = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("0:")) {
            const textContent = line.slice(2).trim();
            if (textContent) {
              try {
                const cleanText = textContent.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
                if (cleanText) {
                  fullText += cleanText;
                  hasReceivedContent = true;
                  
                  // Update the message with accumulated text
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === tempId ? { ...m, text: fullText } : m
                    )
                  );
                }
              } catch {
                // ignore parsing errors
              }
            }
          }
        }
      }

      // If we got no content at all, use fallback
      if (!hasReceivedContent || !fullText.trim()) {
        throw new Error("No content received");
      }
    } catch {
      // Fallback to rule-based reply
      const reply = getBotReply(userText);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, text: reply } : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: nextId(),
      role: "user",
      text: trimmed,
    };

    const currentMessages = [...messages, userMessage];
    setDraft("");
    setMessages(currentMessages);

    // Always try AI first, fallback to rule-based if it fails
    callAI(trimmed, messages);
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
                placeholder="Ask me anything about Eagle Tutorials..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSend();
                  }
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                onClick={onSend}
                disabled={!draft.trim() || isLoading}
                style={{ opacity: draft.trim() && !isLoading ? 1 : 0.7 }}
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
