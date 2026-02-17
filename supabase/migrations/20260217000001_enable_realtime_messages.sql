-- Enable Realtime for messages table
-- This allows messages to be received in real-time without page refresh

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Also enable for conversations to get conversation updates
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable for email_notifications to get notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE email_notifications;

-- Add comment for documentation
COMMENT ON TABLE messages IS 'Chat messages with realtime enabled';
