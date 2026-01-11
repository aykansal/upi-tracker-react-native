# UPI App Detection & Direct Image Sharing - Architecture Document

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Decision: Config Plugin vs Library](#architecture-decision)
3. [System Architecture](#system-architecture)
4. [Module Breakdown](#module-breakdown)
5. [Libraries & Dependencies](#libraries--dependencies)
6. [Native Module Details](#native-module-details)
7. [File Structure](#file-structure)
8. [Implementation Flow](#implementation-flow)
9. [Expo-Specific Considerations](#expo-specific-considerations)
10. [Error Handling & Edge Cases](#error-handling--edge-cases)
11. [References](#references)

---

## 🎯 Overview

### Objective
Replace the generic Android share sheet with a custom in-app UPI app picker that:
1. Detects installed UPI apps using Android PackageManager
2. Displays a bottom sheet UI with app icons and names
3. Shares QR image directly to the selected UPI app via Android Intent

### Requirements Summary
- **Detection Method**: Query PackageManager for apps handling `upi://pay` intents (dynamic discovery)
- **Supported Apps**: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay
- **Sharing Method**: Direct image sharing (not UPI deep links)
- **Development**: Expo config plugin approach (managed workflow compatible)
- **UI**: Bottom sheet similar to native share sheet, with app icons and names
- **Storage**: Cache directory with 5-minute expiry for temporary images
- **Error Handling**: Toast notifications for failures

---

## 🏗️ Architecture Decision: Config Plugin vs Library

### Decision: **Custom Expo Config Plugin**

**Why Config Plugin?**
1. **PackageManager Queries**: Android 11+ requires `<queries>` declarations in AndroidManifest.xml - config plugin can inject these
2. **Custom Intent Creation**: Need `Intent.ACTION_SEND` with `setPackage()` - requires native code
3. **FileProvider Configuration**: Secure image sharing needs FileProvider setup in AndroidManifest
4. **Full Control**: Custom native module gives complete control over detection and sharing logic
5. **Managed Workflow Compatible**: Works with Expo managed workflow (no ejecting needed)

**Why Not Library?**
- Existing libraries (`react-native-share`, `@lokal-dev/react-native-upi-app-launcher`) don't support direct image sharing to specific packages
- Libraries may not handle Android 11+ package visibility requirements properly
- Need custom FileProvider configuration for secure image URIs

### Config Plugin Structure
```
expo-upi-app-launcher/
├── app.plugin.js          # Expo config plugin entry
├── android/
│   ├── build.gradle       # Module dependencies
│   └── src/main/
│       ├── java/.../UPIAppLauncherModule.kt
│       ├── java/.../UPIAppLauncherPackage.java
│       └── AndroidManifest.xml (partial)
└── package.json
```

---

## 🏛️ System Architecture

### High-Level Flow

```
┌─────────────────┐
│  Payment Screen  │
│   (React Native) │
└────────┬─────────┘
         │
         │ 1. User clicks "Pay"
         ▼
┌─────────────────────────┐
│  UPI App Detection      │
│  (Native Module)        │
│  - Query PackageManager │
│  - Filter UPI apps      │
│  - Return app list      │
└────────┬────────────────┘
         │
         │ 2. Return detected apps
         ▼
┌─────────────────────────┐
│  UPI App Picker         │
│  (Bottom Sheet UI)      │
│  - Display apps         │
│  - Show icons & names   │
│  - User selection       │
└────────┬────────────────┘
         │
         │ 3. User selects app
         ▼
┌─────────────────────────┐
│  Image Sharing          │
│  (Native Module)        │
│  - Create content URI   │
│  - Build Intent         │
│  - Set package name     │
│  - Launch Intent        │
└────────┬────────────────┘
         │
         │ 4. Open UPI app
         ▼
┌─────────────────────────┐
│  UPI App (External)     │
│  - Receives image       │
│  - Scans QR code        │
│  - Processes payment    │
└─────────────────────────┘
```

### Component Layers

1. **React Native Layer** (TypeScript/JavaScript)
   - UI Components (Picker, Payment Screen)
   - Service Layer (UPI App Detection Service)
   - State Management

2. **Bridge Layer** (Expo Modules API)
   - Native Module Interface
   - Method Invocation
   - Promise Resolution

3. **Native Android Layer** (Kotlin/Java)
   - PackageManager Queries
   - Intent Creation & Launching
   - FileProvider URI Generation
   - App Icon Retrieval

---

## 📦 Module Breakdown

### 1. Native Module: `UPIAppLauncherModule`

**Location**: `expo-upi-app-launcher/android/src/main/java/.../UPIAppLauncherModule.kt`

**Responsibilities**:
- Detect installed UPI apps via PackageManager
- Retrieve app icons and names
- Share images to specific UPI apps via Intent
- Handle FileProvider URI generation

**Exported Methods**:
```kotlin
// Detect installed UPI apps
fun detectInstalledUPIApps(): Promise<List<UPIAppInfo>>

// Share image to specific UPI app
fun shareImageToApp(imageUri: String, packageName: String): Promise<Boolean>

// Get app icon as base64 (optional)
fun getAppIcon(packageName: String): Promise<String>
```

**UPIAppInfo Structure**:
```typescript
interface UPIAppInfo {
  packageName: string;      // e.g., "com.phonepe.app"
  appName: string;          // e.g., "PhonePe"
  iconBase64?: string;      // App icon as base64 (optional)
}
```

### 2. Service Layer: `services/upi-app-detector.ts`

**Responsibilities**:
- Bridge between React Native and native module
- Cache management (if needed)
- Error handling and retries
- Type definitions

**Key Functions**:
```typescript
export const detectInstalledUPIApps(): Promise<UPIApp[]>
export const shareImageToUPIApp(imageUri: string, app: UPIApp): Promise<boolean>
export const isUPIAppInstalled(packageName: string): Promise<boolean>
```

### 3. UI Component: `components/upi-app-picker.tsx`

**Responsibilities**:
- Bottom sheet UI implementation
- Display detected UPI apps
- Handle user selection
- Show loading states
- Error display

**Props**:
```typescript
interface UPIAppPickerProps {
  visible: boolean;
  onSelectApp: (app: UPIApp) => void;
  onClose: () => void;
  apps: UPIApp[];
  loading?: boolean;
}
```

### 4. Updated Service: `services/upi-launcher.ts`

**Changes**:
- Replace `expo-sharing` with custom native module calls
- Integrate with UPI app picker
- Handle image preparation (cache directory, expiry)

---

## 📚 Libraries & Dependencies

### New Dependencies

#### 1. Custom Expo Module: `expo-upi-app-launcher`
- **Type**: Local package (created via config plugin)
- **Purpose**: Native Android module for UPI app detection and image sharing
- **Installation**: Will be created as a local package

#### 2. Toast Library (Optional)
- **Option A**: `react-native-toast-message` (recommended)
- **Option B**: Custom toast using React Native's built-in components
- **Purpose**: Show error messages ("App not installed", "Try another app")

### Existing Dependencies (No Changes)
- `expo-file-system`: For cache directory management
- `expo-router`: Navigation (already in use)
- `expo-intent-launcher`: May be used as reference, but custom module replaces it

### Native Android Dependencies

**build.gradle** additions:
```gradle
dependencies {
    implementation 'com.facebook.react:react-native:+'
    // No additional native dependencies needed
    // Using Android SDK APIs only
}
```

---

## 🔧 Native Module Details

### 1. PackageManager Query Implementation

**Method**: Query Intent Activities
```kotlin
val intent = Intent(Intent.ACTION_VIEW).apply {
    data = Uri.parse("upi://pay")
}

val resolveInfoList = packageManager.queryIntentActivities(
    intent,
    PackageManager.MATCH_DEFAULT_ONLY
)
```

**Filtering Logic**:
- Check resolved activities against known UPI app package names
- Extract app name from `resolveInfo.activityInfo.loadLabel(packageManager)`
- Retrieve app icon from `resolveInfo.activityInfo.loadIcon(packageManager)`

**Known UPI App Package Names**:
```kotlin
val KNOWN_UPI_PACKAGES = listOf(
    "com.google.android.apps.nbu.paisa.user",  // Google Pay
    "com.phonepe.app",                          // PhonePe
    "net.one97.paytm",                          // Paytm
    "in.org.npci.upiapp",                       // BHIM
    "in.amazon.mShop.android.shopping"          // Amazon Pay
)
```

### 2. Intent Creation for Image Sharing

**Intent Setup**:
```kotlin
val intent = Intent(Intent.ACTION_SEND).apply {
    type = "image/png"  // or "image/jpeg"
    putExtra(Intent.EXTRA_STREAM, imageUri)
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    setPackage(packageName)  // Target specific app
}
```

**FileProvider Configuration**:
- Create `FileProvider` in AndroidManifest.xml
- Configure paths for cache directory
- Generate content URI: `FileProvider.getUriForFile(context, authority, file)`

### 3. AndroidManifest Modifications (via Config Plugin)

**Required Changes**:

1. **Package Queries** (Android 11+):
```xml
<queries>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="upi" />
    </intent>
    <package android:name="com.google.android.apps.nbu.paisa.user" />
    <package android:name="com.phonepe.app" />
    <package android:name="net.one97.paytm" />
    <package android:name="in.org.npci.upiapp" />
    <package android:name="in.amazon.mShop.android.shopping" />
</queries>
```

2. **FileProvider Declaration**:
```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_provider_paths" />
</provider>
```

3. **FileProvider Paths** (`res/xml/file_provider_paths.xml`):
```xml
<paths>
    <cache-path name="qr_cache" path="." />
</paths>
```

---

## 📁 File Structure

### New Files to Create

```
upi-tracker-react-native/
├── expo-upi-app-launcher/              # Custom Expo module
│   ├── app.plugin.js                   # Config plugin entry
│   ├── package.json
│   ├── src/
│   │   └── index.ts                    # TypeScript definitions
│   └── android/
│       ├── build.gradle
│       └── src/main/
│           ├── java/.../UPIAppLauncherModule.kt
│           ├── java/.../UPIAppLauncherPackage.java
│           ├── AndroidManifest.xml
│           └── res/xml/file_provider_paths.xml
│
├── services/
│   ├── upi-app-detector.ts            # NEW: Detection service
│   └── upi-launcher.ts                 # MODIFY: Update sharing logic
│
├── components/
│   └── upi-app-picker.tsx              # NEW: Bottom sheet picker
│
├── app/
│   └── payment.tsx                     # MODIFY: Integrate picker
│
└── app.json                             # MODIFY: Add config plugin
```

### File Responsibilities

**expo-upi-app-launcher/app.plugin.js**:
- Modifies AndroidManifest.xml (adds queries, FileProvider)
- Configures build.gradle if needed
- Links native module

**expo-upi-app-launcher/src/index.ts**:
- TypeScript type definitions
- Module interface exports
- Method signatures

**services/upi-app-detector.ts**:
- JavaScript wrapper around native module
- Error handling
- Promise-based API

**components/upi-app-picker.tsx**:
- Bottom sheet UI component
- App list rendering
- Selection handling

---

## 🔄 Implementation Flow

### Step-by-Step Flow

#### Phase 1: Setup Native Module

1. **Create Config Plugin Structure**
   - Create `expo-upi-app-launcher` directory
   - Set up `app.plugin.js` with AndroidManifest modifications
   - Create Kotlin native module files

2. **Implement Native Module**
   - Write `UPIAppLauncherModule.kt` with detection logic
   - Implement image sharing via Intent
   - Set up FileProvider configuration

3. **Register Module**
   - Create `UPIAppLauncherPackage.java`
   - Register in `MainApplication.java` (via config plugin)

#### Phase 2: JavaScript Layer

4. **Create Detection Service**
   - Write `services/upi-app-detector.ts`
   - Expose `detectInstalledUPIApps()` function
   - Handle errors and edge cases

5. **Create UI Component**
   - Build `components/upi-app-picker.tsx`
   - Implement bottom sheet (using React Native Modal or library)
   - Style to match app theme
   - Add app icons and names

6. **Update Payment Screen**
   - Replace `expo-sharing` calls with picker
   - Integrate detection on payment button click
   - Handle app selection and sharing

#### Phase 3: Image Management

7. **Cache Directory Setup**
   - Use `expo-file-system` cache directory
   - Implement 5-minute expiry cleanup
   - Ensure FileProvider can access cache files

8. **Image URI Generation**
   - Convert file paths to content URIs
   - Pass URIs to native module
   - Handle URI permissions

#### Phase 4: Error Handling

9. **Toast Notifications**
   - Install/configure toast library
   - Show "No UPI apps found" message
   - Show "Failed to open app" message
   - Handle edge cases gracefully

---

## ⚙️ Expo-Specific Considerations

### 1. Development Build Required

**Why**: Expo Go doesn't support custom native modules

**Solution**: 
- Use `eas build` for development builds
- Or use `expo run:android` for local development
- Reference: [Expo Development Builds](https://docs.expo.dev/development/introduction/)

### 2. Config Plugin Registration

**app.json**:
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "./expo-upi-app-launcher/app.plugin.js"
    ]
  }
}
```

### 3. Prebuild Command

After adding config plugin:
```bash
npx expo prebuild --clean
```

This generates native Android project with plugin modifications.

### 4. TypeScript Support

Create type definitions in `expo-upi-app-launcher/src/index.ts`:
```typescript
export interface UPIApp {
  packageName: string;
  appName: string;
  iconBase64?: string;
}

export interface UPIAppLauncherModule {
  detectInstalledUPIApps(): Promise<UPIApp[]>;
  shareImageToApp(imageUri: string, packageName: string): Promise<boolean>;
}
```

### 5. Module Import

In React Native code:
```typescript
import { UPIAppLauncherModule } from 'expo-upi-app-launcher';
```

---

## 🚨 Error Handling & Edge Cases

### Error Scenarios

1. **No UPI Apps Detected**
   - Show toast: "No UPI apps installed"
   - Disable payment button or show alternative

2. **App Not Found During Sharing**
   - Show toast: "App not available, try another app"
   - Return to picker or show error

3. **Image File Not Found**
   - Check file existence before sharing
   - Regenerate QR if needed
   - Show error message

4. **Permission Denied**
   - Handle FileProvider permission errors
   - Show user-friendly error message

5. **Intent Not Handled**
   - Some apps may not support image sharing
   - Fallback to UPI deep link (if applicable)
   - Show error toast

### Edge Cases

1. **Multiple UPI Apps with Same Package Name**
   - Filter duplicates in detection logic

2. **App Uninstalled Between Detection and Sharing**
   - Re-check app availability before sharing
   - Show error if app no longer available

3. **Cache Directory Full**
   - Implement cleanup before saving new images
   - Handle storage errors gracefully

4. **Android Version Compatibility**
   - `<queries>` only needed for Android 11+
   - Handle gracefully on older versions

---

## 📖 References

### Expo Documentation
- [Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [Creating Native Modules](https://docs.expo.dev/modules/overview/)
- [Development Builds](https://docs.expo.dev/development/introduction/)
- [Android Native Modules](https://docs.expo.dev/modules/android-native-modules/)

### Android Documentation
- [Package Visibility](https://developer.android.com/training/package-visibility/declaring)
- [FileProvider](https://developer.android.com/reference/androidx/core/content/FileProvider)
- [Intent.ACTION_SEND](https://developer.android.com/training/sharing/send)
- [PackageManager.queryIntentActivities](https://developer.android.com/reference/android/content/pm/PackageManager#queryIntentActivities(android.content.Intent,%20int))

### React Native
- [Native Modules](https://reactnative.dev/docs/native-modules-android)
- [Platform-specific Code](https://reactnative.dev/docs/platform-specific-code)

---

## ✅ Implementation Checklist

### Native Module
- [ ] Create `expo-upi-app-launcher` directory structure
- [ ] Write `app.plugin.js` config plugin
- [ ] Implement `UPIAppLauncherModule.kt`
- [ ] Create `UPIAppLauncherPackage.java`
- [ ] Configure FileProvider in AndroidManifest
- [ ] Add `<queries>` to AndroidManifest
- [ ] Create `file_provider_paths.xml`
- [ ] Test native module independently

### JavaScript Layer
- [ ] Create `services/upi-app-detector.ts`
- [ ] Create `components/upi-app-picker.tsx`
- [ ] Update `services/upi-launcher.ts`
- [ ] Update `app/payment.tsx`
- [ ] Add TypeScript types
- [ ] Implement error handling
- [ ] Add toast notifications

### Integration
- [ ] Register config plugin in `app.json`
- [ ] Run `npx expo prebuild`
- [ ] Test on Android device
- [ ] Verify app detection works
- [ ] Verify image sharing works
- [ ] Test error scenarios
- [ ] Clean up cache directory logic

### Documentation
- [ ] Update README with new feature
- [ ] Document config plugin usage
- [ ] Add code comments
- [ ] Update architecture docs

---

## 🎯 Success Criteria

1. ✅ Detects all 5 specified UPI apps when installed
2. ✅ Shows bottom sheet with app icons and names
3. ✅ Shares QR image directly to selected app (no share sheet)
4. ✅ Works on Android 11+ devices
5. ✅ Handles errors gracefully with toast messages
6. ✅ Cleans up cache files after 5 minutes
7. ✅ Maintains existing app functionality
8. ✅ No breaking changes to current payment flow

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Author**: Architecture Team  
**Status**: Ready for Implementation
