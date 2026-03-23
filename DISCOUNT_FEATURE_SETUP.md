# Discount Management Feature - Setup Guide

## Overview
Farmers can manage product discounts directly from the Dashboard screen's "My Products" section.

## Features
✅ Tap any product card to open discount management
✅ Enter discount percentage (0-100%)
✅ Toggle "Activate Discount" to make it visible to customers
✅ Set optional end date for the discount
✅ Real-time preview of discounted price and savings
✅ Apply/Update discount with one tap
✅ Remove discount entirely

## ⚠️ IMPORTANT: Database Setup Required

Before the discount feature will work, you **MUST** run the SQL migration in Supabase:

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your FarmCare Expo project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run the Migration
Copy and paste this SQL into the editor and click **Run**:

```sql
-- Add discount columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE;

-- Add check constraint to ensure discount_percentage is between 0 and 100
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_discount_percentage'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT check_discount_percentage CHECK (
            discount_percentage >= 0 AND discount_percentage <= 100
        );
    END IF;
END $$;

-- Add check constraint to ensure discounted_price is positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'check_discounted_price'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT check_discounted_price CHECK (
            discounted_price IS NULL OR discounted_price >= 0
        );
    END IF;
END $$;

-- Add index for querying discounted products efficiently
CREATE INDEX IF NOT EXISTS idx_products_discount_active
ON public.products(discount_active)
WHERE discount_active = true;

-- Add index for discount end date (useful for expiring discounts)
CREATE INDEX IF NOT EXISTS idx_products_discount_end_date
ON public.products(discount_end_date)
WHERE discount_active = true;

-- Comment on columns
COMMENT ON COLUMN public.products.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN public.products.discounted_price IS 'Price after discount is applied';
COMMENT ON COLUMN public.products.discount_active IS 'Whether the discount is currently active';
COMMENT ON COLUMN public.products.discount_start_date IS 'Discount start date/time';
COMMENT ON COLUMN public.products.discount_end_date IS 'Discount end date/time (null for no expiry)';
```

### Step 3: Verify the Migration
1. Go to **Table Editor** → **products** table
2. You should see these new columns:
   - `discount_percentage`
   - `discounted_price`
   - `discount_active`
   - `discount_start_date`
   - `discount_end_date`

### Step 4: Restart Your App
Reload your app to fetch the updated schema.

## How to Use the Discount Feature

### Adding a Discount
1. Open the app and go to **Dashboard** screen
2. Scroll to **"My Products"** section
3. Tap on any product card
4. The discount modal will open
5. Enter discount percentage (e.g., 20 for 20%)
6. Toggle **"Activate Discount"** to ON
7. (Optional) Set an end date
8. Tap **"Apply Discount"**

### Editing a Discount
1. Tap on a product with an active discount (shows "% OFF" badge)
2. Modify the percentage or end date
3. Tap **"Update Discount"**

### Removing a Discount
1. Tap on the product
2. Tap the red **"Remove"** button
3. Confirm the removal

### Deactivating a Discount (Without Removing)
1. Tap on the product
2. Toggle **"Activate Discount"** to OFF
3. Tap **"Apply Discount"**
4. The discount data is preserved but hidden from customers

## Debugging

If the discount feature is not working, check the console logs:

1. **Products not loading?**
   - Look for: `🟢 Fetched products: X`
   - If 0, you have no products yet - add some products first
   - If error, check: `🔴 Error fetching products:`

2. **Modal not opening?**
   - Look for: `🟢 Product card pressed: [product name]`
   - Look for: `🟢 Opening discount modal for product:`
   - If these don't appear, the tap is not registering

3. **Database error?**
   - If you see: `column products.discount_percentage does not exist`
   - **Solution:** Run the SQL migration above

## File Locations
- Dashboard Screen: `src/screens/farmer/DashboardScreen.tsx`
- Migration SQL: `apply-discount-migration.sql`

## Testing Checklist
- [ ] SQL migration has been run
- [ ] Products table has discount columns
- [ ] App has been restarted
- [ ] Farmer has at least one product
- [ ] Tapping product card opens modal
- [ ] Discount percentage can be entered
- [ ] Toggle switch works
- [ ] Apply Discount saves successfully
- [ ] Discount badge appears on product card
- [ ] Remove discount works
