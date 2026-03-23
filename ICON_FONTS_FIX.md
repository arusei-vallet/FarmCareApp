# Icon Fonts Fix for Expo

## Problem
Icons from `react-native-vector-icons` were not displaying in the Expo app because the icon fonts were not being loaded.

## Solution
Added font loading in `App.tsx` using `expo-font` to load the required icon fonts before the app renders.

## What Was Changed

### 1. App.tsx
Added font loading in the `useEffect` hook:

```typescript
import * as Font from 'expo-font';

// In the prepareApp function:
await Font.loadAsync({
  'Ionicons': require('react-native-vector-icons/Fonts/Ionicons.ttf'),
  'MaterialCommunityIcons': require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
});
```

Added loading state and screen:

```typescript
const [fontsLoaded, setFontsLoaded] = useState(false);
const [appReady, setAppReady] = useState(false);

// Show loading screen while fonts load
if (!appReady || !fontsLoaded) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={PRIMARY} />
      <Text style={styles.loadingText}>Loading FarmCare...</Text>
    </View>
  );
}
```

## Icon Fonts Loaded

The following icon fonts are now loaded on app start:

1. **Ionicons** - Used for UI icons (notifications, arrows, etc.)
2. **MaterialCommunityIcons** - Used for agricultural and product icons

## Usage in Components

### Ionicons
```typescript
import Ionicons from 'react-native-vector-icons/Ionicons';

// Usage:
<Ionicons name="notifications-outline" size={24} color="#fff" />
```

### MaterialCommunityIcons
```typescript
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Usage:
<MCIcon name="agriculture" size={20} color="#2e7d32" />
```

## Available Icon Names

### Ionicons (v6.x)
Browse: https://icons.expo.fyi (Ionicons tab)

Common icons used:
- `notifications-outline` - Notifications
- `log-out-outline` - Logout
- `close` - Close/Cancel
- `checkmark` - Check/Confirm
- `arrow-back` - Back arrow
- `search` - Search
- `cart-outline` - Cart
- `cube-outline` - Inventory/Cube
- `calendar-outline` - Calendar
- `call-outline` - Phone call

### MaterialCommunityIcons (v14.x)
Browse: https://pictogrammers.com/library/mdi/

Common icons used:
- `agriculture` - Farming/Agriculture
- `truck-delivery` - Delivery
- `clipboard-list` - Orders/List
- `package-variant` - Products/Package
- `clock-outline` - Time/History
- `chart-line` - Analytics
- `plus-circle-outline` - Add
- `warehouse` - Inventory/Warehouse
- `fruit-cherries` - Products/Fruit
- `tag-percent` - Discount/Percentage
- `notifications-none` - Notifications
- `alert-circle` - Alert/Warning

## Troubleshooting

### Icons Still Not Showing?

1. **Clear cache and rebuild:**
   ```bash
   npx expo start -c
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check that the font files exist:**
   ```
   node_modules/react-native-vector-icons/Fonts/
   ├── Ionicons.ttf
   ├── MaterialCommunityIcons.ttf
   └── ...
   ```

4. **For production builds:**
   Make sure the fonts are included in the build. For Expo EAS Build, this is handled automatically.

## Adding New Icons

If you need to use additional icon sets:

1. Install the icon package (if not already installed):
   ```bash
   npm install react-native-vector-icons
   ```

2. Add the font to App.tsx:
   ```typescript
   await Font.loadAsync({
     'FontAwesome': require('react-native-vector-icons/Fonts/FontAwesome.ttf'),
     // Add more as needed
   });
   ```

3. Import and use in your component:
   ```typescript
   import FontAwesome from 'react-native-vector-icons/FontAwesome';
   
   <FontAwesome name="star" size={24} color="#gold" />
   ```

## Performance Note

Font loading happens once on app startup. The loading screen is shown only during the initial load. Subsequent navigation between screens will not be affected.

## Files Modified

- `App.tsx` - Added font loading logic and loading screen
- `src/hooks/useIconFonts.ts` - Created reusable hook for future use

## References

- [Expo Font Documentation](https://docs.expo.dev/guides/using-custom-fonts/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
- [Ionicons](https://ionic.io/ionicons)
- [Material Design Icons](https://pictogrammers.com/library/mdi/)
