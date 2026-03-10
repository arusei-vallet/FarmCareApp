# Profile Screen Setup Guide

## Overview
The Profile Screen now displays real-time data from your Supabase database:
- **User Name**: From `users.full_name`
- **Total Orders**: Count from `orders` table
- **Rating**: Average from `reviews` table
- **Coupons**: Active coupons from `coupons` table

## Database Setup

### 1. Run the Coupons Schema

Open Supabase SQL Editor and run the `coupons-schema.sql` file:

```sql
-- Copy and paste the contents of coupons-schema.sql into Supabase SQL Editor
```

This will:
- Create the `coupons` table
- Enable Row Level Security (RLS)
- Create policies for user access
- Add a trigger to give welcome coupons to new users

### 2. Verify Tables Exist

Make sure these tables exist in your database:
- `users` (from `supabase-schema.sql`)
- `orders` (from `supabase-schema.sql`)
- `reviews` (from `supabase-schema.sql`)
- `coupons` (from `coupons-schema.sql`)

## Features

### Profile Statistics

The profile screen now shows:

| Stat | Source | Description |
|------|--------|-------------|
| **Total Orders** | `orders` table | Count of all orders by the customer |
| **Rating** | `reviews` table | Average rating given by the user |
| **Coupons** | `coupons` table | Count of active, unused coupons |

### Coupons System

**Coupon Types:**
- **Percentage Discount**: e.g., 15% off
- **Fixed Discount**: e.g., KES 150 off

**Coupon Features:**
- Unique codes per user
- Minimum order amount requirements
- Expiration dates
- Usage tracking
- Auto-generated welcome coupons for new users

**Welcome Coupons (Auto-generated):**
1. **WELCOME15**: 15% off (max KES 150) on orders over KES 500
2. **FREESHIP**: KES 150 off (free delivery) on orders over KES 1000

### Coupons Screen

Navigate to Profile → Coupons to view:
- Active coupons with copy-to-clipboard functionality
- Expired and used coupons
- Discount amounts and conditions
- Expiration dates

## File Changes

### Modified Files
1. **`src/screens/customer/ProfileScreen.tsx`**
   - Fetches real user data from Supabase
   - Displays loading states
   - Shows actual order count, rating, and coupons
   - Added navigation to Coupons screen

2. **`src/screens/customer/CouponsScreen.tsx`** (New)
   - Displays all user coupons
   - Copy coupon codes to clipboard
   - Shows active and expired/used coupons
   - Pull-to-refresh functionality

3. **`coupons-schema.sql`** (New)
   - Database schema for coupons table
   - RLS policies
   - Welcome coupon trigger

## Usage

### For New Users
When a new customer registers:
1. Profile is created in `users` table
2. Trigger automatically creates 2 welcome coupons
3. Profile screen shows 0 orders, N/A rating, 2 coupons

### For Existing Users
The profile will automatically show:
- Total orders from order history
- Average rating from reviews given
- Active coupons count

### Manual Coupon Creation

To manually give coupons to a user:

```sql
INSERT INTO public.coupons (
  user_id, 
  code, 
  description, 
  discount_type, 
  discount_value, 
  min_order_amount, 
  expires_at
) VALUES (
  'USER_UUID_HERE',
  'SPECIAL20',
  'Special 20% discount',
  'percentage',
  20.00,
  1000.00,
  NOW() + INTERVAL '30 days'
);
```

## Testing

1. **Test Profile Loading:**
   - Login as a customer
   - Navigate to Profile
   - Verify name, orders, rating, and coupons display correctly

2. **Test Coupons:**
   - Navigate to Profile → Coupons
   - Verify welcome coupons appear for new users
   - Test copy-to-clipboard functionality
   - Verify expired coupons show in correct section

3. **Test Order Count:**
   - Place an order from the app
   - Refresh profile
   - Verify order count increases

4. **Test Rating:**
   - Leave a product review
   - Refresh profile
   - Verify rating updates

## Troubleshooting

### Profile shows 0 for all stats
- Check if user is logged in
- Verify RLS policies are correct
- Check browser console for errors

### Coupons not appearing
- Run `coupons-schema.sql` in Supabase
- Verify the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_user_coupons'`
- Manually run: `SELECT give_welcome_coupons('USER_UUID')`

### Rating shows N/A
- User hasn't left any reviews yet
- This is normal for new users

## Next Steps

Consider adding:
- [ ] Push notifications for expiring coupons
- [ ] Coupon sharing/referral system
- [ ] Loyalty points integration
- [ ] Order rating from sellers
- [ ] Delivery address management UI
- [ ] Payment methods management UI
