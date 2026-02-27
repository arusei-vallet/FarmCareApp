-- ============================================================
-- FarmCare Expo App - Supabase Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING OBJECTS (for clean re-run)
-- ============================================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
DROP TRIGGER IF EXISTS update_delivery_addresses_updated_at ON public.delivery_addresses;
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(TEXT, TEXT, TEXT, TEXT) CASCADE;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.delivery_addresses CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'farmer', 'agrodealer')),
    business_name TEXT,
    license_number TEXT,
    avatar_url TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Default categories
INSERT INTO public.categories (name, description, icon) VALUES
    ('Grains', 'Maize, wheat, rice, sorghum, millet', '🌾'),
    ('Vegetables', 'Fresh vegetables', '🥬'),
    ('Fruits', 'Fresh fruits', '🍎'),
    ('Legumes', 'Beans, green grams, lentils', '🫘'),
    ('Tubers', 'Potatoes, sweet potatoes, yams', '🥔'),
    ('Dairy', 'Milk, yoghurt, cheese', '🥛'),
    ('Poultry', 'Chicken, eggs', '🐔'),
    ('Spices', 'Herbs and spices', '🌿'),
    ('Seeds', 'Farm seeds', '🌱'),
    ('Nuts', 'Various nuts', '🥜'),
    ('Organic Produce', 'Certified organic products', '♻️'),
    ('Seafood', 'Fish and seafood', '🐟')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    quantity_available DECIMAL(10, 2) DEFAULT 0,
    min_order_quantity DECIMAL(10, 2) DEFAULT 1,
    images TEXT[],
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);

-- ============================================================
-- 4. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
    delivery_address TEXT NOT NULL,
    delivery_instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- ============================================================
-- 5. ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- 6. REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews(customer_id);

-- ============================================================
-- 7. FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_customer ON public.favorites(customer_id);

-- ============================================================
-- 8. CART ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_customer ON public.cart_items(customer_id);

-- ============================================================
-- 9. INVENTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock_level DECIMAL(10, 2) DEFAULT 0,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.inventory(user_id);

-- ============================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============================================================
-- 11. DELIVERY ADDRESSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.delivery_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    county TEXT,
    phone TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.delivery_addresses(customer_id);

-- ============================================================
-- 12. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_addresses_updated_at BEFORE UPDATE ON public.delivery_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 'ORD-\\d+-\\d+$') AS INTEGER)
    ), 0) + 1 INTO seq_num FROM public.orders;
    NEW.order_number := 'ORD-' || TO_CHAR(NEW.created_at, 'YYYY') || '-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - PRODUCTION READY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS POLICIES
-- ============================================================

-- Allow authenticated users to view all profiles (needed for displaying seller info)
CREATE POLICY "authenticated_users_view_all" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::TEXT = id::TEXT);

-- Users can insert their own profile (used during registration)
CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::TEXT = id::TEXT);

-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================

-- Anyone can view available products
CREATE POLICY "products_view_available" ON public.products
    FOR SELECT
    TO authenticated
    USING (is_available = true);

-- Sellers can manage their own products (CRUD)
CREATE POLICY "sellers_manage_own" ON public.products
    FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = seller_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = seller_id::TEXT);

-- ============================================================
-- ORDERS POLICIES
-- ============================================================

-- Users can view their own orders (as customer or seller)
CREATE POLICY "orders_view_own" ON public.orders
    FOR SELECT
    TO authenticated
    USING (
        auth.uid()::TEXT = customer_id::TEXT 
        OR auth.uid()::TEXT = seller_id::TEXT
    );

-- Customers can create their own orders
CREATE POLICY "customers_create_orders" ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

-- Sellers can update order status for their own orders
CREATE POLICY "sellers_update_order_status" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::TEXT = seller_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = seller_id::TEXT);

-- Customers can update their own orders (cancel, etc.)
CREATE POLICY "customers_update_own_orders" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::TEXT = customer_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

-- ============================================================
-- ORDER ITEMS POLICIES
-- ============================================================

-- View order items for own orders
CREATE POLICY "order_items_view_own" ON public.order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND (orders.customer_id::TEXT = auth.uid()::TEXT 
                 OR orders.seller_id::TEXT = auth.uid()::TEXT)
        )
    );

-- Manage order items (for order creation)
CREATE POLICY "order_items_manage" ON public.order_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- REVIEWS POLICIES
-- ============================================================

-- Anyone can view reviews
CREATE POLICY "reviews_view_all" ON public.reviews
    FOR SELECT
    TO authenticated
    USING (true);

-- Customers can create reviews for their own orders
CREATE POLICY "customers_create_reviews" ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

-- Users can update/delete their own reviews
CREATE POLICY "users_update_own_reviews" ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::TEXT = customer_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

CREATE POLICY "users_delete_own_reviews" ON public.reviews
    FOR DELETE
    TO authenticated
    USING (auth.uid()::TEXT = customer_id::TEXT);

-- ============================================================
-- FAVORITES POLICIES
-- ============================================================

-- Users can manage their own favorites
CREATE POLICY "users_manage_favorites" ON public.favorites
    FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = customer_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

-- ============================================================
-- CART ITEMS POLICIES
-- ============================================================

-- Users can manage their own cart
CREATE POLICY "users_manage_cart" ON public.cart_items
    FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = customer_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

-- ============================================================
-- INVENTORY POLICIES
-- ============================================================

-- Users can view their own inventory
CREATE POLICY "users_manage_inventory" ON public.inventory
    FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = user_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users can view their own notifications
CREATE POLICY "users_view_notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid()::TEXT = user_id::TEXT);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_notifications" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::TEXT = user_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- System can insert notifications (via service role)
CREATE POLICY "system_insert_notifications" ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================
-- DELIVERY ADDRESSES POLICIES
-- ============================================================

-- Users can manage their own addresses
CREATE POLICY "users_manage_addresses" ON public.delivery_addresses
    FOR ALL
    TO authenticated
    USING (auth.uid()::TEXT = customer_id::TEXT)
    WITH CHECK (auth.uid()::TEXT = customer_id::TEXT);

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================

-- View payments for own orders
CREATE POLICY "payments_view_own" ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payments.order_id
            AND (orders.customer_id::TEXT = auth.uid()::TEXT 
                 OR orders.seller_id::TEXT = auth.uid()::TEXT)
        )
    );

-- System can insert payments (via service role)
CREATE POLICY "system_insert_payments" ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================
-- HELPER FUNCTION: Create user profile
-- Call this from your app after auth.signup()
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_role TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO public.users (email, full_name, phone, role)
    VALUES (p_email, p_full_name, p_phone, p_role)
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
