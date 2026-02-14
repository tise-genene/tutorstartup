"use client";

import { useParams } from "next/navigation";
import { PageShell } from "../../_components/PageShell";
import { ConversationList } from "../../_components/ConversationList";
import { ChatWindow } from "../../_components/ChatWindow";
import { useAuth } from "../../providers";

export default function ConversationPage() {
  const { auth } = useAuth();
  const params = useParams();
  const conversationId = params?.id as string;

  if (!auth) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl">
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--foreground)]/60">Please log in to view messages.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl h-[calc(100vh-140px)]">
        <div className="glass-panel h-full overflow-hidden flex">
          {/* Conversation List - Sidebar (hidden on mobile when viewing conversation) */}
          <div className="hidden lg:block w-80 xl:w-96 border-r border-[var(--border)] flex-shrink-0">
            <ConversationList selectedId={conversationId} />
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            <ChatWindow 
              conversationId={conversationId}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
