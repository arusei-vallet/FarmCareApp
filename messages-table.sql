-- Messages table for customer-seller communication
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_product ON public.messages(product_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages table
-- Users can see messages where they are sender or receiver
CREATE POLICY IF NOT EXISTS "Users can view their messages"
    ON public.messages
    FOR SELECT
    USING (
        auth.uid() = sender_id 
        OR auth.uid() = receiver_id
    );

-- Users can insert messages (send messages)
CREATE POLICY IF NOT EXISTS "Users can send messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

-- Users can update their own messages (mark as read)
CREATE POLICY IF NOT EXISTS "Users can update message read status"
    ON public.messages
    FOR UPDATE
    USING (
        auth.uid() = receiver_id
    );
