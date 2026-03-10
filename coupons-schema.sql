-- ============================================================
-- Coupons Table Schema for FarmCare Expo App
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- COUPONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_coupons_user ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_expires ON public.coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_used ON public.coupons(is_used);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Users can view their own coupons
CREATE POLICY "users_view_own_coupons" ON public.coupons
    FOR SELECT
    TO authenticated
    USING (auth.uid()::TEXT = user_id::TEXT);

-- System can insert coupons (via service role or admin)
CREATE POLICY "system_insert_coupons" ON public.coupons
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can update their own coupons (mark as used)
CREATE POLICY "users_update_own_coupons" ON public.coupons
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::TEXT = user_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- ============================================================
-- SAMPLE COUPONS (Optional - for testing)
-- ============================================================
-- These will be inserted for new users via a trigger or function
-- ============================================================

-- ============================================================
-- FUNCTION: Give welcome coupons to new users
-- ============================================================
CREATE OR REPLACE FUNCTION public.give_welcome_coupons(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Welcome coupon - 15% off
    INSERT INTO public.coupons (user_id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, expires_at)
    VALUES (
        user_id,
        'WELCOME15-' || substr(user_id::text, 1, 6),
        'Welcome! Get 15% off on your first order',
        'percentage',
        15.00,
        500.00,
        150.00,
        NOW() + INTERVAL '30 days'
    );

    -- Free delivery coupon
    INSERT INTO public.coupons (user_id, code, description, discount_type, discount_value, min_order_amount, expires_at)
    VALUES (
        user_id,
        'FREESHIP-' || substr(user_id::text, 1, 6),
        'Free delivery on orders over KES 1000',
        'fixed',
        150.00,
        1000.00,
        NOW() + INTERVAL '14 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: Auto-give coupons to new users
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_user_coupons_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Give welcome coupons to new customer users
    IF NEW.role = 'customer' THEN
        PERFORM public.give_welcome_coupons(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_user_coupons'
    ) THEN
        CREATE TRIGGER trigger_create_user_coupons
            AFTER INSERT ON public.users
            FOR EACH ROW
            EXECUTE FUNCTION public.create_user_coupons_trigger();
    END IF;
END $$;

-- ============================================================
-- END OF COUPONS SCHEMA
-- ============================================================
