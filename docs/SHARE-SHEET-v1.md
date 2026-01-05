# UPI App Detection & Direct Image Sharing Architecture

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Approach](#architecture-approach)
3. [System Components](#system-components)
4. [Required Libraries & Dependencies](#required-libraries--dependencies)
5. [Native Module Specifications](#native-module-specifications)
6. [Android Configuration](#android-configuration)
7. [Data Flow & Sequence](#data-flow--sequence)
8. [Implementation Modules](#implementation-modules)
9. [Technical Specifications](#technical-specifications)
10. [Error Handling & Edge Cases](#error-handling--edge-cases)
11. [Testing Strategy](#testing-strategy)
12. [References](#references)

---

## 🎯 Overview

### Objective
Implement a custom UPI app detection and direct image sharing system that:
- Detects installed UPI apps on Android devices
- Presents a custom in-app picker (no system share sheet)
- Shares QR code images directly to the selected UPI app
- Provides better UX for payment tracking workflows

### Current State
- Uses `expo-sharing` with system share sheet
- Shows all apps (not just UPI apps)
- Generic "Share Image" dialog is not payment-focused

### Target State
- Custom UPI app picker within the app
- Only shows detected UPI payment apps
- Direct image sharing to selected app
- Payment-focused user experience

---

## 🏗️ Architecture Approach

### Hybrid Detection + Custom Intent

This approach combines:
1. **Native Module** for UPI app detection (using PackageManager)
2. **Native Module** for direct image sharing (using Android Intent)
3. **React Native/TypeScript** service layer for orchestration
4. **React Native** UI components for app picker

### Architecture Layers

```
┌─────────────────────────────────────────┐
│   React Native UI Layer                 │
│   - UPIAppPicker Component              │
│   - Payment Screen Integration          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   TypeScript Service Layer              │
│   - upi-launcher.ts (refactored)        │
│   - UPI app detection logic             │
│   - Image sharing orchestration         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Expo Native Module Layer               │
│   - UPIDetectionModule (Kotlin)         │
│   - UPIShareModule (Kotlin)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   Android Native APIs                    │
│   - PackageManager                       │
│   - Intent (ACTION_SEND)                 │
│   - FileProvider                         │
└──────────────────────────────────────────┘
```

---

## 🧩 System Components

### 1. Native Modules (Expo Modules API)

#### Module 1: UPIDetectionModule
**Purpose**: Detect installed UPI apps on Android device

**Responsibilities**:
- Query PackageManager for apps handling `upi://pay` intent
- Check specific UPI app package names
- Retrieve app metadata (name, icon, package)
- Return list of detected UPI apps to JavaScript

**Native Implementation**:
- **Language**: Kotlin
- **API**: Android PackageManager
- **Method**: `queryIntentActivities()` with `upi://pay` URI
- **Fallback**: Direct package name checks for known UPI apps

#### Module 2: UPIShareModule
**Purpose**: Share image directly to specific UPI app

**Responsibilities**:
- Create Android Intent with ACTION_SEND
- Set target package name
- Generate FileProvider URI for image
- Launch Intent to selected app

**Native Implementation**:
- **Language**: Kotlin
- **API**: Android Intent, FileProvider
- **Intent Action**: `Intent.ACTION_SEND`
- **MIME Type**: `image/png` or `image/jpeg`
- **Target**: Specific package via `intent.setPackage()`

### 2. TypeScript Service Layer

#### Service: `services/upi-launcher.ts` (Refactored)
**Responsibilities**:
- Orchestrate UPI app detection
- Manage app picker state
- Handle image sharing flow
- Error handling and fallbacks

**Key Functions**:
- `detectInstalledUPIApps()`: Call native module to get apps
- `shareQRImageToApp()`: Share image to specific app
- `getUPIAppIcon()`: Get app icon (if available)
- `isUPIAppInstalled()`: Check if specific app is installed

### 3. React Native UI Components

#### Component: `components/upi-app-picker.tsx`
**Purpose**: Custom in-app picker for UPI apps

**Features**:
- Modal/bottom sheet UI
- List of detected UPI apps
- App icons and names
- Selection callback
- Loading states
- Empty state handling

#### Integration: `app/payment.tsx`
**Changes**:
- Replace `expo-sharing` share sheet
- Show custom UPI app picker
- Handle app selection
- Share image to selected app

---

## 📦 Required Libraries & Dependencies

### Existing Dependencies (Already Installed)
```json
{
  "expo": "~54.0.30",
  "expo-file-system": "^19.0.21",
  "expo-intent-launcher": "^13.0.8"
}
```

### New Dependencies Required

#### 1. Expo Modules API (Built-in with Expo SDK 54)
- **Package**: Built into Expo SDK
- **Purpose**: Create native modules
- **Documentation**: https://docs.expo.dev/modules/module-api/

#### 2. No Additional NPM Packages Required
All functionality will be implemented via:
- Expo Modules API (native modules)
- Existing Expo packages
- Custom native code

### Development Dependencies

#### For Native Module Development
- **Android Studio** or **Android SDK** (for testing native code)
- **Kotlin** (for Android native module)
- **Java Development Kit (JDK)** 11 or higher

---

## 🔧 Native Module Specifications

### Module 1: UPIDetectionModule

#### Module Definition
```kotlin
// Location: modules/upi-detection/android/src/main/java/.../UPIDetectionModule.kt

class UPIDetectionModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("UPIDetection")
        
        // Function: Get all installed UPI apps
        AsyncFunction("getInstalledUPIApps") {
            // Implementation
        }
        
        // Function: Check if specific app is installed
        AsyncFunction("isAppInstalled") { packageName: String ->
            // Implementation
        }
    }
}
```

#### Detection Methods

**Method 1: Intent Resolution (Primary)**
- Create Intent with `upi://pay` URI
- Query PackageManager for activities handling this intent
- Extract package names and app info
- Filter for known UPI apps

**Method 2: Direct Package Check (Fallback)**
- Maintain list of known UPI app package names
- Check each package existence via PackageManager
- Return installed apps

#### Known UPI App Package Names
```kotlin
val KNOWN_UPI_PACKAGES = listOf(
    "com.google.android.apps.nbu.paisa.user",  // Google Pay
    "com.phonepe.app",                         // PhonePe
    "net.one97.paytm",                         // Paytm
    "in.org.npci.upiapp",                      // BHIM
    "in.amazon.mShop.android.shopping",       // Amazon Pay
    "com.dreamplug.androidapp",                // CRED
    "com.mobikwik_new",                        // MobiKwik
    "com.freecharge.android",                  // Freecharge
    "com.airtel.money",                        // Airtel Thanks
    "com.axis.mobile"                          // Axis Pay
)
```

#### Return Data Structure
```typescript
interface UPIApp {
  packageName: string;
  appName: string;
  icon?: string; // Base64 encoded icon (optional)
  canHandleUPI: boolean;
}
```

### Module 2: UPIShareModule

#### Module Definition
```kotlin
// Location: modules/upi-share/android/src/main/java/.../UPIShareModule.kt

class UPIShareModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("UPIShare")
        
        // Function: Share image to specific app
        AsyncFunction("shareImageToApp") { 
            imageUri: String, 
            packageName: String 
        } {
            // Implementation
        }
    }
}
```

#### Sharing Implementation

**Steps**:
1. Validate image URI exists
2. Create FileProvider URI (if needed)
3. Create Intent with ACTION_SEND
4. Set MIME type to `image/png` or `image/jpeg`
5. Attach image URI to intent
6. Set target package: `intent.setPackage(packageName)`
7. Add FLAG_ACTIVITY_NEW_TASK flag
8. Start activity with intent

**FileProvider Configuration**:
- Required for secure file sharing
- Configured in AndroidManifest.xml
- Provides content:// URI instead of file://

---

## 🤖 Android Configuration

### 1. AndroidManifest.xml Modifications

#### FileProvider Configuration
```xml
<application>
    <!-- FileProvider for secure file sharing -->
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
</application>
```

#### File Paths Configuration
**File**: `android/app/src/main/res/xml/file_paths.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="qr_images" path="." />
    <external-cache-path name="qr_images_external" path="." />
</paths>
```

#### Queries Declaration (Android 11+)
**File**: `AndroidManifest.xml` (inside `<manifest>` tag)
```xml
<queries>
    <!-- UPI Intent -->
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="upi" />
    </intent>
    
    <!-- Known UPI Apps -->
    <package android:name="com.google.android.apps.nbu.paisa.user" />
    <package android:name="com.phonepe.app" />
    <package android:name="net.one97.paytm" />
    <package android:name="in.org.npci.upiapp" />
    <package android:name="in.amazon.mShop.android.shopping" />
    <package android:name="com.dreamplug.androidapp" />
    <!-- Add more as needed -->
</queries>
```

### 2. app.json Configuration

#### Expo Config Plugin
```json
{
  "expo": {
    "plugins": [
      [
        "./plugins/upi-detection-plugin",
        {
          "fileProviderAuthorities": "com.upitracker.app.fileprovider"
        }
      ]
    ]
  }
}
```

#### Android Permissions
```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

---

## 🔄 Data Flow & Sequence

### Flow 1: UPI App Detection

```
User Action: Opens Payment Screen
    │
    ▼
Payment Screen Component
    │
    ▼
Call: detectInstalledUPIApps()
    │
    ▼
UPIDetectionModule (Native)
    │
    ▼
Android PackageManager
    │
    ├─► Query Intent: upi://pay
    │   └─► Get activities handling UPI intents
    │
    └─► Check Known Packages
        └─► Verify package existence
    │
    ▼
Return: Array<UPIApp>
    │
    ▼
Update UI State
    │
    ▼
Show UPI App Picker
```

### Flow 2: Image Sharing

```
User Action: Selects UPI App
    │
    ▼
UPI App Picker Component
    │
    ▼
Call: shareQRImageToApp(imageUri, packageName)
    │
    ▼
UPIShareModule (Native)
    │
    ├─► Validate Image URI
    ├─► Generate FileProvider URI
    ├─► Create Intent (ACTION_SEND)
    ├─► Set MIME Type (image/png)
    ├─► Attach Image URI
    ├─► Set Target Package
    └─► Launch Intent
    │
    ▼
Android System
    │
    ▼
Target UPI App Opens
    │
    ▼
QR Image Available in UPI App
```

---

## 💻 Implementation Modules

### Module Structure

```
modules/
├── upi-detection/
│   ├── android/
│   │   └── src/main/java/.../UPIDetectionModule.kt
│   ├── src/
│   │   └── UPIDetectionModule.ts
│   └── expo-module.config.json
│
├── upi-share/
│   ├── android/
│   │   └── src/main/java/.../UPIShareModule.kt
│   ├── src/
│   │   └── UPIShareModule.ts
│   └── expo-module.config.json
│
└── upi-detection-plugin/
    └── index.js (Expo Config Plugin)
```

### TypeScript Service Layer

**File**: `services/upi-launcher.ts`

**Key Functions**:
```typescript
// Detect installed UPI apps
async function detectInstalledUPIApps(): Promise<UPIApp[]>

// Share image to specific app
async function shareQRImageToApp(
  imageUri: string, 
  app: UPIApp
): Promise<boolean>

// Check if specific app is installed
async function isUPIAppInstalled(packageName: string): Promise<boolean>

// Get app icon (if available)
async function getUPIAppIcon(packageName: string): Promise<string | null>
```

### React Native Components

**File**: `components/upi-app-picker.tsx`

**Props**:
```typescript
interface UPIAppPickerProps {
  visible: boolean;
  onSelectApp: (app: UPIApp) => void;
  onClose: () => void;
  qrImageUri: string;
}
```

**Features**:
- Modal/bottom sheet presentation
- List of detected UPI apps
- App icons and names
- Loading states
- Empty state (no apps found)
- Error handling

---

## 📐 Technical Specifications

### Android API Requirements

#### Minimum SDK Version
- **minSdkVersion**: 21 (Android 5.0 Lollipop)
- **targetSdkVersion**: 34 (Android 14)

#### Required Android APIs
- **PackageManager**: API Level 1+
- **Intent.ACTION_SEND**: API Level 1+
- **FileProvider**: API Level 24+ (required for secure sharing)
- **queryIntentActivities()**: API Level 1+
- **Queries Declaration**: API Level 30+ (Android 11)

### Image Format Requirements

#### Supported Formats
- PNG (preferred for QR codes)
- JPEG
- File size limit: ~10MB (reasonable for QR codes)

#### Image Storage
- Use `expo-file-system` cache directory
- Path: `FileSystem.cacheDirectory + 'qr_images/'`
- File naming: `qr_${timestamp}.png`

### Performance Considerations

#### Detection Performance
- Detection should complete in < 500ms
- Cache detection results (valid for session)
- Async operation to avoid blocking UI

#### Memory Management
- Release image resources after sharing
- Use FileProvider URIs (not direct file paths)
- Clean up temporary files periodically

---

## ⚠️ Error Handling & Edge Cases

### Error Scenarios

#### 1. No UPI Apps Installed
- **Handling**: Show empty state in picker
- **Message**: "No UPI apps found. Please install a UPI app to continue."
- **Action**: Provide link to Play Store or dismiss

#### 2. Image File Not Found
- **Handling**: Validate URI before sharing
- **Fallback**: Regenerate QR code if needed
- **Error Message**: "QR code image not found"

#### 3. Target App Cannot Handle Image
- **Handling**: Try sharing anyway (app may handle it)
- **Fallback**: Show error and allow retry
- **Error Message**: "Unable to share to selected app"

#### 4. FileProvider Not Configured
- **Handling**: Check configuration at build time
- **Error**: Build-time error (config plugin should catch)

#### 5. Permission Denied
- **Handling**: Request permissions gracefully
- **Fallback**: Use alternative storage location
- **Error Message**: "Storage permission required"

### Edge Cases

#### Android Version Compatibility
- **Android 10 and below**: Use direct file paths (if needed)
- **Android 11+**: Must use FileProvider and queries declaration
- **Android 12+**: Scoped storage enforcement

#### App-Specific Behaviors
- Some UPI apps may not accept shared images
- Some apps may require specific MIME types
- Handle app crashes gracefully

---

## 🧪 Testing Strategy

### Unit Tests
- Test UPI app detection logic
- Test image sharing function
- Test error handling

### Integration Tests
- Test native module communication
- Test FileProvider URI generation
- Test Intent creation

### Manual Testing Checklist
- [ ] Detect UPI apps with various combinations installed
- [ ] Share image to each detected UPI app
- [ ] Handle no UPI apps installed scenario
- [ ] Test on Android 10, 11, 12, 13, 14
- [ ] Test with different image formats
- [ ] Test error scenarios
- [ ] Verify FileProvider configuration
- [ ] Test app picker UI/UX

---

## 📚 References

### Expo Documentation
- **Expo Modules API**: https://docs.expo.dev/modules/module-api/
- **Creating Native Modules**: https://docs.expo.dev/modules/get-started/
- **Config Plugins**: https://docs.expo.dev/config-plugins/introduction/
- **File System**: https://docs.expo.dev/versions/latest/sdk/filesystem/

### Android Documentation
- **PackageManager**: https://developer.android.com/reference/android/content/pm/PackageManager
- **Intent.ACTION_SEND**: https://developer.android.com/training/sharing/send
- **FileProvider**: https://developer.android.com/reference/androidx/core/content/FileProvider
- **Queries Declaration**: https://developer.android.com/training/package-visibility/use-cases

### UPI App Package Names
- Google Pay: `com.google.android.apps.nbu.paisa.user`
- PhonePe: `com.phonepe.app`
- Paytm: `net.one97.paytm`
- BHIM: `in.org.npci.upiapp`
- Amazon Pay: `in.amazon.mShop.android.shopping`

---

## 🎯 Implementation Checklist

### Phase 1: Native Modules Setup
- [ ] Create Expo module structure
- [ ] Implement UPIDetectionModule (Kotlin)
- [ ] Implement UPIShareModule (Kotlin)
- [ ] Create TypeScript bindings
- [ ] Test native module communication

### Phase 2: Android Configuration
- [ ] Configure FileProvider in AndroidManifest
- [ ] Create file_paths.xml
- [ ] Add queries declaration
- [ ] Create Expo config plugin
- [ ] Test build configuration

### Phase 3: Service Layer
- [ ] Refactor upi-launcher.ts
- [ ] Implement detection functions
- [ ] Implement sharing functions
- [ ] Add error handling
- [ ] Add TypeScript types

### Phase 4: UI Components
- [ ] Create UPIAppPicker component
- [ ] Integrate with Payment screen
- [ ] Add loading states
- [ ] Add error states
- [ ] Style according to theme

### Phase 5: Testing & Polish
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Error scenario testing
- [ ] Performance optimization
- [ ] Documentation updates

---

## 📝 Notes

### Why Expo Modules API?
- Works with managed Expo workflow
- No need to eject
- TypeScript-first approach
- Modern Kotlin/Java integration
- Official Expo support

### Why Not Use Existing Libraries?
- Most libraries don't support direct image sharing to specific packages
- Custom solution provides full control
- Better integration with existing codebase
- No external dependencies

### Future Enhancements
- Cache app icons for better performance
- Support for app-specific deep links (if available)
- Analytics for most-used UPI apps
- User preference for default UPI app