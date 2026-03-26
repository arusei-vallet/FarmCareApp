# 🎨 FarmCare Logo Setup Guide

## ✅ What's Been Configured

Your logo is now configured in:

- ✅ `app.json` - App icon configuration
- ✅ `app.config.js` - Runtime configuration
- ❌ Splash Screen: **REMOVED** - App starts directly with Onboarding screen

## 📁 Where to Place Your Logo File

**Copy your logo file to:**

```
c:\Users\User\farmcare-expo\src\assets\logos\logo.png
```

**File name:** `logo.png` (rename from "Green and White Organic Agriculture Logo.png")

## 📐 Logo Requirements

### Recommended Specifications:

- **Format:** PNG (transparent background recommended)
- **Size:** 1024x1024 pixels (minimum)
- **Aspect Ratio:** 1:1 (square)
- **Background:** Transparent or solid color

### What the Logo Is Used For:

1. **App Icon** - Home screen icon on iOS/Android
2. **App Store / Play Store** - Store listing icon
3. **App Launcher** - Navigation header (optional)

## 🎯 Next Steps

### Step 1: Copy Logo File

1. Find your logo file: "Green and White Organic Agriculture Logo.png"
2. Copy it to: `c:\Users\User\farmcare-expo\src\assets\logos\`
3. Rename it to: `logo.png`

### Step 2: Install Splash Screen Plugin

```bash
npx expo install expo-splash-screen
```

### Step 3: Rebuild the App

```bash
# Clear cache
npx expo start -c

# Or rebuild for production
npx eas build --platform android
npx eas build --platform ios
```

## 🖼️ Logo in App UI (Optional)

If you want to show the logo in the app header/navigation:

### Add to App.tsx Header:

The logo will automatically appear on the splash screen. To add it to the app launcher/header, we need to update the navigation.

## 📱 Where Your Logo Appears

After setup, your logo will appear in:

| Location               | Platform      | Status                        |
| ---------------------- | ------------- | ----------------------------- |
| App Icon (Home Screen) | iOS & Android | ✅ Configured                 |
| Splash Screen          | iOS & Android | ✅ Configured                 |
| App Store / Play Store | Store Listing | ✅ Uses same icon             |
| App Header/Launcher    | In-App        | ⚠️ Optional (needs UI update) |

## 🔧 Manual Logo Placement (If Needed)

If you want to manually place the logo in specific screens:

### Example: Add to Onboarding Screen

```tsx
// In src/screens/auth/OnboardingScreen.tsx
import { Image } from "react-native";

<Image
  source={require("../../assets/logos/logo.png")}
  style={{ width: 120, height: 120, marginBottom: 20 }}
  resizeMode="contain"
/>;
```

### Example: Add to Navigation Header

```tsx
// In src/navigation/CustomerTabs.tsx
import { Image } from "react-native";

headerShown: true;
headerTitle: () => (
  <Image
    source={require("../../assets/logos/logo.png")}
    style={{ width: 40, height: 40 }}
    resizeMode="contain"
  />
);
```

## 🎨 Splash Screen Preview

Your splash screen will have:

- **Background Color:** #1B5E20 (Deep Green - FarmCare brand color)
- **Logo:** Centered, 200px width
- **Resize Mode:** Contain (maintains aspect ratio)

## ✅ Verification Checklist

After copying the logo:

- [ ] Logo file exists at: `src/assets/logos/logo.png`
- [ ] File is PNG format
- [ ] Image is at least 1024x1024 pixels
- [ ] expo-splash-screen is installed
- [ ] App rebuild completed

## 🐛 Troubleshooting

### Logo Not Showing

1. **Check file path:** Ensure logo is at `src/assets/logos/logo.png`
2. **Clear cache:** `npx expo start -c`
3. **Rebuild app:** `npx eas build`

### Splash Screen Not Showing

1. **Install plugin:** `npx expo install expo-splash-screen`
2. **Rebuild app:** Plugins require rebuild
3. **Check config:** Verify `app.json` has splash screen config

### Icon Looks Blurry

- Use higher resolution logo (1024x1024 or larger)
- Ensure PNG format with good quality
- Avoid stretching small images

## 📞 Need Help?

If you need assistance:

1. Check that logo file is in correct location
2. Verify file format is PNG
3. Clear Expo cache: `npx expo start -c`
4. Rebuild the app

---

**Created:** 2026-03-26  
**Project:** FarmCare Expo  
**Logo Path:** `src/assets/logos/logo.png`  
**Brand Color:** #1B5E20 (Green)
