# 🛠️ Android Emulator Storage Upload - Troubleshooting Guide

## Problem
"Network request failed" when uploading images from Android emulator to Supabase Storage.

## Why This Happens

The Android emulator has network restrictions that can block connections to external services like Supabase. This is **NOT** a bug in your code.

## Solutions (Try in Order)

### ✅ Solution 1: Test on Physical Device (BEST)

The easiest solution - test on a real phone:

```bash
# Start Expo
npm start

# Then:
# - Scan QR code with Expo Go app on your phone
# - Or use "Run on Android device" option
```

**Physical devices don't have the emulator's network restrictions.**

---

### ✅ Solution 2: Clear Emulator Cache & Restart

Sometimes the emulator's network stack gets stuck:

1. **Stop the emulator**
2. **In Android Studio**: Device Manager → Wipe Data on your emulator
3. **Restart emulator**
4. **Restart Expo**: `npm start`

---

### ✅ Solution 3: Use Different Emulator Network Type

1. Open emulator
2. Click **⋮** (three dots) → **Settings** → **Cellular**
3. Change **Network type** to **LTE** or **5G**
4. Try upload again

---

### ✅ Solution 4: Check Emulator Internet

Open Chrome in the emulator and visit:
- `https://www.google.com` 
- `https://jluxaezbaiilupmfgmgm.supabase.co`

If these don't load, the emulator has no internet.

---

### ✅ Solution 5: Use Development Build

Instead of Expo Go, create a development build:

```bash
npx expo run:android
```

This creates a custom build with proper permissions.

---

### ✅ Solution 6: Configure Emulator DNS

1. Close emulator
2. Start emulator from command line:
```bash
emulator -avd YOUR_AVD_NAME -dns-server 8.8.8.8
```

---

### ✅ Solution 7: Use Web for Testing

Test in browser instead:

```bash
npm run web
```

Web doesn't have the same network restrictions.

---

## Verify It's Working

After trying a solution, check console logs:

**Success:**
```
📤 Uploading image...
  Bucket: products
  Blob created - Size: 1225257 bytes
  ✓ Upload successful (blob method)
  ✓ Public URL: https://...
```

**Still Failing:**
```
❌ All upload methods failed: Network request failed
```

---

## Quick Test: Can Your Emulator Reach Supabase?

Add this temporary test in your app:

```javascript
// Add to any screen temporarily
const testConnection = async () => {
  try {
    const response = await fetch('https://jluxaezbaiilupmfgmgm.supabase.co/')
    console.log('✅ Supabase reachable:', response.status)
  } catch (error) {
    console.log('❌ Supabase NOT reachable:', error.message)
  }
}
```

---

## Recommended Workflow

1. **Development**: Use **web** (`npm run web`) for quick testing
2. **Testing**: Use **physical device** for final testing
3. **Production**: Always test on real devices before release

---

## Still Not Working?

As a temporary workaround, the app now:
- ✅ Saves products even if image upload fails
- ✅ Uses placeholder images
- ✅ Shows clear error messages

You can add products now, and upload images later when the network issue is resolved.
