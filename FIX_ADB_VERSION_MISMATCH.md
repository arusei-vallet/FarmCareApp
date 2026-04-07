# Fix ADB Version Mismatch Error

## Error
```
Error: adb server version (36) doesn't match this client (41)
could not read ok from ADB Server
* failed to start daemon
error: cannot connect to daemon
```

## Cause
The ADB server is running an old version (36) while Expo CLI expects version (41).

---

## Solution 1: Kill ADB and Restart (Quick Fix)

### Windows Command Prompt:
```cmd
adb kill-server
adb start-server
```

### If `adb` is not found:

Find ADB location:
```cmd
where adb
```

Or check common locations:
- `C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- `C:\Program Files\Android\Android Studio\platform-tools\adb.exe`

Then run:
```cmd
"C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe" kill-server
"C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe" start-server
```

---

## Solution 2: Update Platform-Tools (Recommended)

### Using SDK Manager:
```cmd
sdkmanager --update
sdkmanager "platform-tools"
```

### Or download manually:
1. Visit: https://developer.android.com/studio/releases/platform-tools
2. Download latest Platform-Tools
3. Extract to: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools`
4. Add to PATH

---

## Solution 3: Use Expo Go (No ADB Required)

For development without emulator:

1. **Install Expo Go on your phone:**
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

2. **Start Expo:**
   ```bash
   npm start
   ```

3. **Scan QR code:**
   - Android: Use Expo Go app
   - iOS: Use Camera app

---

## Solution 4: Use Android Emulator (No ADB conflicts)

### Start Expo with emulator:
```bash
npm run android
```

Expo will:
- Create/manage its own emulator
- Use compatible ADB version
- Avoid conflicts

---

## Solution 5: Add ADB to PATH (Permanent Fix)

### Step 1: Find ADB
```cmd
dir C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe
```

### Step 2: Add to PATH

1. Open **System Properties**
   - Win + R → `sysdm.cpl` → Enter

2. **Environment Variables**
   - Click "Environment Variables"

3. **Edit PATH**
   - Under "User variables", select `Path`
   - Click "Edit"
   - Click "New"
   - Add: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools`
   - Click OK

4. **Restart terminal**

### Step 3: Verify
```cmd
adb version
```

---

## Quick Workaround for Expo

If you just want to run the app:

### Use Expo Go (Recommended for Development):
```bash
npm start
```

Then scan QR code with your phone.

### Or use prebuilt emulator:
```bash
npx expo run:android --device
```

---

## Check ADB Status

```cmd
# Check if ADB is running
adb devices

# Check version
adb version

# Kill server
adb kill-server

# Start fresh
adb start-server
```

---

## For This Project

Since you're getting ADB errors, try:

### Option A: Use Expo Go (Easiest)
```bash
npm start
```
- Install Expo Go on phone
- Scan QR code
- Test on real device

### Option B: Fix ADB
```cmd
# Find and kill old ADB
taskkill /F /IM adb.exe

# Update platform-tools
# Download from: https://developer.android.com/studio/releases/platform-tools

# Restart
npm run android
```

---

**Recommended:** Use Expo Go for development - no ADB issues!
