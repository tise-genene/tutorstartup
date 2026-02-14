"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageShell } from "../_components/PageShell";
import { ConversationList } from "../_components/ConversationList";
import { ChatWindow } from "../_components/ChatWindow";
import { useAuth, useI18n } from "../providers";
import type { Conversation } from "../../lib/types";

export default function MessagesPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id as string | undefined;
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    router.push(`/messages/${conversation.id}`);
  };

  if (!auth) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl">
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--foreground)]/60">{t("state.loginRequired")}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl h-[calc(100vh-140px)]">
        <div className="glass-panel h-full overflow-hidden flex">
          {/* Conversation List - Sidebar */}
          <div className={`${conversationId ? "hidden lg:block" : ""} w-full lg:w-80 xl:w-96 border-r border-[var(--border)] flex-shrink-0`}>
            <ConversationList
              selectedId={conversationId}
              onSelectConversation={handleSelectConversation}
            />
          </div>

          {/* Chat Window */}
          <div className={`${conversationId ? "" : "hidden lg:flex"} flex-1 flex flex-col`}>
            {conversationId ? (
              <ChatWindow
                conversationId={conversationId}
                onBack={() => router.push("/messages")}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
                <p className="text-[var(--foreground)]/60 max-w-md">
                  Select a conversation from the list to view messages, or start a new conversation with a tutor.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
