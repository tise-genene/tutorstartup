-- Migration: Messaging System
-- Created: 2026-02-14
-- Description: Adds conversation and messaging tables for client-tutor communication

-- 1. Create conversation status enum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED');

-- 2. Create conversations table
-- A conversation is created when a client wants to message a tutor about a specific job or proposal
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_post_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status "ConversationStatus" DEFAULT 'ACTIVE',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, tutor_id, job_post_id)
);

-- 3. Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create conversation participants table (for tracking read status per user)
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 5. Create indexes for performance
CREATE INDEX idx_conversations_parent_id ON public.conversations(parent_id);
CREATE INDEX idx_conversations_tutor_id ON public.conversations(tutor_id);
CREATE INDEX idx_conversations_job_post_id ON public.conversations(job_post_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);

-- 6. Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Conversations

-- Users can view conversations they're part of
CREATE POLICY "Users can view their own conversations" 
  ON public.conversations FOR SELECT 
  USING (auth.uid() = parent_id OR auth.uid() = tutor_id);

-- Users can create conversations if they are the parent or tutor
CREATE POLICY "Users can create conversations" 
  ON public.conversations FOR INSERT 
  WITH CHECK (auth.uid() = parent_id OR auth.uid() = tutor_id);

-- Users can update conversations they're part of
CREATE POLICY "Users can update their own conversations" 
  ON public.conversations FOR UPDATE 
  USING (auth.uid() = parent_id OR auth.uid() = tutor_id);

-- 8. RLS Policies for Messages

-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (parent_id = auth.uid() OR tutor_id = auth.uid())
    )
  );

-- Users can send messages to conversations they're part of
CREATE POLICY "Users can send messages to their conversations" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (parent_id = auth.uid() OR tutor_id = auth.uid())
    )
  );

-- Users can update their own messages (for read receipts)
CREATE POLICY "Users can update read status" 
  ON public.messages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (parent_id = auth.uid() OR tutor_id = auth.uid())
    )
  );

-- 9. RLS Policies for Conversation Participants

-- Users can view their own participant records
CREATE POLICY "Users can view their participant records" 
  ON public.conversation_participants FOR SELECT 
  USING (user_id = auth.uid());

-- Users can update their own participant records
CREATE POLICY "Users can update their participant records" 
  ON public.conversation_participants FOR UPDATE 
  USING (user_id = auth.uid());

-- 10. Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation's last_message_at
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  -- Update unread counts for other participant
  UPDATE public.conversation_participants
  SET unread_count = unread_count + 1,
      updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id
  AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger for new messages
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_message();

-- 12. Function to create conversation participants when conversation is created
CREATE OR REPLACE FUNCTION public.handle_new_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Create participant records for both users
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (NEW.id, NEW.parent_id),
    (NEW.id, NEW.tutor_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger for new conversations
CREATE TRIGGER on_conversation_created
  AFTER INSERT ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_conversation();

-- 14. Function to mark messages as read when user reads conversation
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Mark all unread messages as read
  UPDATE public.messages
  SET is_read = TRUE,
      read_at = NOW()
  WHERE conversation_id = p_conversation_id
  AND sender_id != p_user_id
  AND is_read = FALSE;
  
  -- Reset unread count for this user
  UPDATE public.conversation_participants
  SET unread_count = 0,
      last_read_at = NOW(),
      updated_at = NOW()
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, UUID) TO authenticated;
