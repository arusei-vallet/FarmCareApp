# Farmer Discount Feature

## Overview

Farmers can now add discounts to their products directly from the Dashboard. This feature allows farmers to:
- Set discount percentages (0-100%)
- Preview the discounted price in real-time
- Set optional end dates for discounts
- Activate/deactivate discounts
- Remove discounts entirely

## Database Migration

**IMPORTANT:** Before using this feature, you must run the SQL migration to add discount columns to the products table.

### Steps to Apply Migration:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `apply-discount-migration.sql`
4. Click **Run**

The migration adds these columns to the `products` table:
- `discount_percentage` - The discount percentage (0-100)
- `discounted_price` - The calculated price after discount
- `discount_active` - Boolean flag to activate/deactivate the discount
- `discount_start_date` - Optional start date/time
- `discount_end_date` - Optional end date/time

## UI Features

### My Products Section

A new "My Products" section appears on the farmer's dashboard showing:
- Up to 5 most recent products
- Current price and stock availability
- Active discount badges (if any)
- Tap any product to manage its discount

**Visual Indicators:**
- **No Discount**: Shows "Tap to add discount" hint with tag icon
- **Active Discount**: Shows red badge with percentage off (e.g., "20% OFF")
- **Strikethrough Price**: Original price shown with strikethrough
- **Green Badge**: Discounted price highlighted in green

### Discount Modal

When a farmer taps on a product, the discount modal opens with:

1. **Product Information**
   - Current price
   - Current discount (if active)

2. **Discount Percentage Input**
   - Numeric input for discount percentage
   - Real-time preview of new price
   - Shows amount saved

3. **Activate/Deactivate Toggle**
   - Switch to activate or hide the discount
   - Visual feedback on toggle state

4. **End Date (Optional)**
   - Set expiry date for the discount
   - Leave empty for permanent discount

5. **Action Buttons**
   - **Apply/Update Discount**: Saves the discount
   - **Remove**: Removes existing discount (only shown if discount is active)

## How to Use

### Adding a Discount

1. Navigate to the Dashboard
2. Scroll to "My Products" section
3. Tap on a product card
4. Enter discount percentage (e.g., 20 for 20%)
5. Toggle "Activate Discount" to ON
6. (Optional) Set an end date
7. Tap "Apply Discount"

### Editing a Discount

1. Tap on a product with an active discount
2. Modify the percentage or end date
3. Tap "Update Discount"

### Removing a Discount

1. Tap on a product with an active discount
2. Tap the red "Remove" button
3. Confirm the removal

### Deactivating a Discount (Without Removing)

1. Tap on the product
2. Toggle "Activate Discount" to OFF
3. Tap "Update Discount"
4. The discount data is preserved but hidden from customers

## Technical Details

### State Management

```typescript
const [discountModalVisible, setDiscountModalVisible] = useState(false);
const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<any>(null);
const [discountPercentage, setDiscountPercentage] = useState("");
const [discountEndDate, setDiscountEndDate] = useState("");
const [discountActive, setDiscountActive] = useState(false);
```

### Key Functions

- `openDiscountModal(product)` - Opens the modal for a specific product
- `calculateDiscountedPrice(price, percentage)` - Calculates discounted price
- `handleApplyDiscount()` - Saves discount to database
- `removeDiscount(product)` - Removes discount from product

### Database Schema

```sql
discount_percentage DECIMAL(5, 2) DEFAULT 0
discounted_price DECIMAL(10, 2)
discount_active BOOLEAN DEFAULT false
discount_start_date TIMESTAMP WITH TIME ZONE
discount_end_date TIMESTAMP WITH TIME ZONE
```

## Customer View

**Note:** The customer-facing screens (CartScreen, ProductDetailScreen) will need to be updated to:
1. Display the discounted price when `discount_active` is true
2. Show the original price with strikethrough
3. Display the discount percentage badge

The discounted price should be used for all calculations in the cart and checkout process.

## Future Enhancements

- [ ] Automatic discount expiry (cron job to deactivate expired discounts)
- [ ] Discount analytics (track sales increase during discounts)
- [ ] Bulk discount management
- [ ] Discount templates (quick apply common percentages)
- [ ] Customer notifications for new discounts on favorite products
