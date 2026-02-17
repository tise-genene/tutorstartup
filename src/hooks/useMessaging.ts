"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import type { 
  Conversation, 
  Message, 
  CreateConversationPayload, 
  SendMessagePayload,
  ConversationWithDetails 
} from "../lib/types";

const LIMIT = 50;

export function useMessaging(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          parent:parent_id(id, name, avatar_url),
          tutor:tutor_id(id, name, avatar_url),
          job_post:job_post_id(id, title, status),
          proposal:proposal_id(id, status),
          last_message:messages!inner(conversation_id, content, created_at, sender:sender_id(id, name))
        `)
        .or(`parent_id.eq.${userId},tutor_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get unread counts
      const { data: participantsData, error: participantsError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, unread_count")
        .eq("user_id", userId);

      if (participantsError) throw participantsError;

      const unreadMap = new Map(
        participantsData?.map((p) => [p.conversation_id, p.unread_count]) || []
      );

      const formattedConversations: Conversation[] = (data || []).map((conv: any) => ({
        id: conv.id,
        jobPostId: conv.job_post_id,
        proposalId: conv.proposal_id,
        parentId: conv.parent_id,
        tutorId: conv.tutor_id,
        status: conv.status,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        parent: conv.parent,
        tutor: conv.tutor,
        jobPost: conv.job_post,
        proposal: conv.proposal,
        lastMessage: conv.last_message?.[0],
        unreadCount: unreadMap.get(conv.id) || 0,
      }));

      setConversations(formattedConversations);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, pageNum = 1) => {
    if (!userId || !conversationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const offset = (pageNum - 1) * LIMIT;
      
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .range(offset, offset + LIMIT - 1);

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        isRead: msg.is_read,
        readAt: msg.read_at,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        sender: msg.sender,
      }));

      if (pageNum === 1) {
        setMessages(formattedMessages.reverse());
      } else {
        setMessages((prev) => [...formattedMessages.reverse(), ...prev]);
      }
      
      setHasMore(formattedMessages.length === LIMIT);
      setPage(pageNum);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Create a new conversation
  const createConversation = useCallback(async (payload: CreateConversationPayload) => {
    if (!userId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("parent_id", userId)
        .eq("tutor_id", payload.tutorId)
        .eq("job_post_id", payload.jobPostId || null)
        .single();

      if (existingConv) {
        // Conversation exists, just add the message
        const { data: message, error: msgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: existingConv.id,
            sender_id: userId,
            content: payload.initialMessage,
          })
          .select()
          .single();

        if (msgError) throw msgError;
        
        return existingConv.id;
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          parent_id: userId,
          tutor_id: payload.tutorId,
          job_post_id: payload.jobPostId || null,
          proposal_id: payload.proposalId || null,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Send initial message
      const { error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: userId,
          content: payload.initialMessage,
        });

      if (msgError) throw msgError;

      return conversation.id;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  // Send a message
  const sendMessage = useCallback(async (payload: SendMessagePayload) => {
    if (!userId) return null;
    
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: payload.conversationId,
          sender_id: userId,
          content: payload.content,
          file_url: payload.fileUrl || null,
          file_name: payload.fileName || null,
          file_size: payload.fileSize || null,
        })
        .select(`
          *,
          sender:sender_id(id, name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const message: Message = {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        fileUrl: data.file_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        isRead: data.is_read,
        readAt: data.read_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        sender: data.sender,
      };

      setMessages((prev) => [...prev, message]);
      return message;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [userId, supabase]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId || !conversationId) return;
    
    try {
      await supabase.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });

      // Update local state immediately
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === conversationId && msg.senderId !== userId
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  }, [userId, supabase]);

  // Force refresh conversations (used after marking as read)
  const refreshConversations = useCallback(async () => {
    await fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender details
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, name, avatar_url, role")
            .eq("id", newMessage.sender_id)
            .single();

          const message: Message = {
            id: newMessage.id,
            conversationId: newMessage.conversation_id,
            senderId: newMessage.sender_id,
            content: newMessage.content,
            fileUrl: newMessage.file_url,
            fileName: newMessage.file_name,
            fileSize: newMessage.file_size,
            isRead: newMessage.is_read,
            readAt: newMessage.read_at,
            createdAt: newMessage.created_at,
            updatedAt: newMessage.updated_at,
            sender: sender || undefined,
          };

          // Add to messages if it's for the active conversation
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            if (activeConversation?.id === message.conversationId) {
              return [...prev, message];
            }
            return prev;
          });

          // Update conversations list
          setConversations((prev) => {
            const existingIndex = prev.findIndex((c) => c.id === message.conversationId);
            if (existingIndex === -1) {
              // New conversation - fetch it
              fetchConversations();
              return prev;
            }

            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount:
                message.senderId !== userId && activeConversation?.id !== message.conversationId
                  ? (updated[existingIndex].unreadCount || 0) + 1
                  : updated[existingIndex].unreadCount,
            };

            // Move to top
            const [conv] = updated.splice(existingIndex, 1);
            return [conv, ...updated];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, supabase, activeConversation?.id, fetchConversations]);

  // Get total unread count
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, [conversations]);

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    error,
    hasMore,
    page,
    totalUnreadCount,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    markAsRead,
    refreshConversations,
    setActiveConversation,
    loadMore: () => fetchMessages(activeConversation?.id || "", page + 1),
  };
}

export function useConversation(conversationId: string | null, userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch conversation with participants
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          *,
          parent:parent_id(id, name, avatar_url),
          tutor:tutor_id(id, name, avatar_url),
          job_post:job_post_id(id, title, status)
        `)
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;

      const otherUser = convData.parent_id === userId ? convData.tutor : convData.parent;

      const conversation: ConversationWithDetails = {
        id: convData.id,
        jobPostId: convData.job_post_id,
        proposalId: convData.proposal_id,
        parentId: convData.parent_id,
        tutorId: convData.tutor_id,
        status: convData.status,
        lastMessageAt: convData.last_message_at,
        createdAt: convData.created_at,
        updatedAt: convData.updated_at,
        parent: convData.parent,
        tutor: convData.tutor,
        jobPost: convData.job_post,
        messages: [],
        participants: [],
        otherUser,
      };

      setConversation(conversation);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(id, name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      const formattedMessages: Message[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
        isRead: msg.is_read,
        readAt: msg.read_at,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        sender: msg.sender,
      }));

      setMessages(formattedMessages);

      // Mark as read
      await supabase.rpc("mark_conversation_read", {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, supabase]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Only process messages from OTHER users (our own messages are added immediately by sendMessage)
          if (newMessage.sender_id !== userId) {
            // Fetch sender details
            const { data: sender } = await supabase
              .from("profiles")
              .select("id, name, avatar_url, role")
              .eq("id", newMessage.sender_id)
              .single();

            const message: Message = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              fileUrl: newMessage.file_url,
              fileName: newMessage.file_name,
              fileSize: newMessage.file_size,
              isRead: true, // Auto-mark as read since user is viewing
              readAt: new Date().toISOString(),
              createdAt: newMessage.created_at,
              updatedAt: newMessage.updated_at,
              sender: sender || undefined,
            };

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, userId, supabase]);

  const sendMessage = useCallback(async (content: string, fileData?: { url: string; name: string; size: number }) => {
    if (!conversationId || !userId) return null;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content,
          file_url: fileData?.url,
          file_name: fileData?.name,
          file_size: fileData?.size,
        })
        .select(`
          *,
          sender:sender_id(id, name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const message: Message = {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        fileUrl: data.file_url,
        fileName: data.file_name,
        fileSize: data.file_size,
        isRead: data.is_read,
        readAt: data.read_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        sender: data.sender,
      };

      setMessages((prev) => [...prev, message]);
      return message;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [conversationId, userId, supabase]);

  return {
    conversation,
    messages,
    loading,
    error,
    sendMessage,
    refresh: fetchConversation,
  };
}
