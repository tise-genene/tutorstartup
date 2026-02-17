"use client";

import { useState, useRef, useEffect } from "react";
import { useConversation, useMessaging } from "../../hooks/useMessaging";
import { useAuth, useNotificationContext } from "../../app/providers";
import { useFileUpload, formatFileSize, getFileIcon, UploadedFile } from "../../hooks/useFileUpload";
import type { Message, EmailNotification } from "../../lib/types";

function PaperclipIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
      <polyline points="20 12 9 23 4 18"/>
    </svg>
  );
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      {!isOwn && showAvatar && (
        <div className="mr-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-sm font-semibold text-[var(--accent)]">
            {message.sender?.name?.[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-10" />}
      
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? "bg-[var(--accent)] text-white rounded-br-md"
              : "bg-[var(--muted)] text-[var(--foreground)] rounded-bl-md"
          }`}
        >
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mb-2">
              {message.attachments.map((attachment: UploadedFile, idx: number) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isOwn ? "bg-white/20" : "bg-[var(--background)]"
                  }`}
                >
                  <span className="text-lg">{getFileIcon(attachment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{attachment.name}</div>
                    <div className="text-xs opacity-70">{formatFileSize(attachment.size)}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
          
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 text-xs text-[var(--foreground)]/50 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className="text-[var(--accent)]">
              {message.isRead ? <DoubleCheckIcon /> : <CheckIcon />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { auth } = useAuth();
  const { conversation, messages, loading, error, sendMessage, refresh } = useConversation(
    conversationId,
    auth?.user.id || null
  );
  const { refreshConversations } = useMessaging(auth?.user.id || null);
  const { notifications, markAsOpened } = useNotificationContext();
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFiles, uploading: fileUploading, progress } = useFileUpload({
    bucket: 'messages',
    folder: auth?.user.id
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark message notifications as opened when viewing conversation
  useEffect(() => {
    if (!conversationId || !notifications.length) return;
    
    // Find notifications for this conversation that haven't been opened
    const messageNotifications = notifications.filter(
      (n: EmailNotification) => n.type === 'NEW_MESSAGE' && 
           n.metadata?.conversation_id === conversationId &&
           !n.openedAt
    );
    
    // Mark each notification as opened
    messageNotifications.forEach((notification: EmailNotification) => {
      markAsOpened(notification.id);
    });
  }, [conversationId, notifications, markAsOpened]);

  // Refresh conversation list to clear unread badge
  useEffect(() => {
    if (!loading && conversation) {
      // Small delay to ensure the mark_as_read RPC has completed
      const timer = setTimeout(() => {
        refreshConversations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, conversation, refreshConversations]);

  const handleSend = async () => {
    if ((!inputValue.trim() && pendingFiles.length === 0) || isSending) return;
    
    setIsSending(true);
    
    // Send message using the hook which updates state immediately
    const fileData = pendingFiles.length > 0 ? {
      url: pendingFiles[0].url,
      name: pendingFiles[0].name,
      size: pendingFiles[0].size
    } : undefined;
    
    const success = await sendMessage(inputValue.trim() || '', fileData);
    
    if (success) {
      setInputValue("");
      setPendingFiles([]);
    }
    
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploaded = await uploadFiles(files);
    if (uploaded.length > 0) {
      setPendingFiles(prev => [...prev, ...uploaded]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (fileId: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          {onBack && (
            <button onClick={onBack} className="ui-btn ui-btn-ghost p-2">
              ← Back
            </button>
          )}
          <div className="animate-pulse h-6 w-32 bg-[var(--muted)] rounded" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="ui-btn ui-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const otherUser = conversation?.otherUser;

  return (
    <div className="flex flex-col h-full bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="ui-btn ui-btn-ghost p-2 lg:hidden">
              ←
            </button>
          )}
          <div className="h-10 w-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-lg font-semibold text-[var(--accent)]">
            {otherUser?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-semibold">{otherUser?.name || "Unknown"}</h3>
            {conversation?.jobPost && (
              <p className="text-xs text-[var(--foreground)]/60">
                Re: {conversation.jobPost.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)]/50">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === auth?.user.id;
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)]">
        {/* Pending Files */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-elevated)] rounded-full text-sm"
              >
                <span>{getFileIcon(file.type)}</span>
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removePendingFile(file.id)}
                  className="text-[var(--muted)] hover:text-red-500 ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={fileUploading}
            className="ui-btn ui-btn-ghost p-2 flex-shrink-0 disabled:opacity-50"
            title="Attach file"
          >
            {fileUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--accent)]" />
            ) : (
              <PaperclipIcon />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 min-h-[44px] max-h-32 resize-none rounded-lg border border-[var(--border)] bg-[var(--input)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            rows={1}
          />
          
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && pendingFiles.length === 0) || isSending}
            className="ui-btn ui-btn-primary p-2 flex-shrink-0 disabled:opacity-50"
            title="Send message"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
