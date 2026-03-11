# Property Manager - Android App

React Native + Expo mobile app that mirrors the Property Manager web app. Connects to the same .NET backend API.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on device) or Android emulator

## Setup

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on Android:
   - Press `a` in the terminal to open in Android emulator, or
   - Scan the QR code with Expo Go on your physical device

## First Launch

1. **Server URL**: The app uses `https://tenants-app-fga3bpcbgtarf0d9.westcentralus-01.azurewebsites.net` as the default server. You can change it in **Settings** or via "Change Server" on the login screen.
2. **Login**: Use the same credentials as the web app (default: `admin` / `Admin@123`).

## Building & Installing APK on Android

### Option 1: EAS Build (Cloud - Recommended)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to Expo** (create a free account at [expo.dev](https://expo.dev) if needed):
   ```bash
   eas login
   ```

3. **Configure the project** (first time only):
   ```bash
   cd tenants.mobile
   eas build:configure
   ```
   This creates/updates `eas.json` (already present in this project).

4. **Build the APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   - `preview` profile produces an APK (not AAB) suitable for direct install.
   - The build runs in the cloud; you’ll get a link to track progress.

5. **Download the APK** when the build finishes (link in terminal or [expo.dev](https://expo.dev) → your project → Builds).

6. **Install on your Android phone**:
   - **Via link**: Open the build link on your phone and download the APK.
   - **Via USB**: Copy the APK to your phone and open it.
   - **Via ADB** (phone connected via USB, USB debugging enabled):
     ```bash
     adb install path/to/your-app.apk
     ```
   - If prompted, enable **Install from unknown sources** (or **Install unknown apps**) for your browser/file manager in Android Settings.

### Option 2: Local Build

Requires Android Studio and Android SDK installed:

```bash
cd tenants.mobile
npx expo prebuild
npx expo run:android
```

This generates the `android/` folder and produces a debug APK in `android/app/build/outputs/apk/debug/`. For a release APK, use:

```bash
cd android
./gradlew assembleRelease
```

The release APK will be in `android/app/build/outputs/apk/release/`.

## Project Structure

```
tenants.mobile/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout, auth, providers
│   ├── login.tsx           # Login + server URL config
│   ├── (app)/              # Authenticated screens
│   │   ├── (tabs)/         # Dashboard + Settings tabs
│   │   ├── property/[id]   # Property detail
│   │   └── tenant/[id]     # Tenant detail
│   └── src/                # Shared code
│       ├── api.ts          # API client
│       ├── config.ts       # Server URL management
│       ├── types.ts        # TypeScript interfaces
│       ├── context/        # Auth, Theme, Notifications
│       └── components/     # Modals, etc.
├── eas.json                # EAS Build config
└── app.json                # Expo config
```

## Features

- Properties list with bill summary
- Property detail: floors, tenants, bills, utility connections
- Add/edit/delete properties, floors, tenants, utilities
- Collect rent, manage rent increase rules
- Bills: filter by month, mark paid/unpaid, view snapshot
- Scrape Now for bill fetching
- Dark/light theme
- Server URL configuration

## Sharing Data with Web App

Both the mobile app and web app connect to the same backend API. The mobile app defaults to `https://tenants-app-fga3bpcbgtarf0d9.westcentralus-01.azurewebsites.net`. To use a different server:

1. Web app: Deploy the built `tenants.client/dist` to your server (or serve it from the same host).
2. Mobile app: Change the server URL in **Settings** or on the login screen.

Both clients use the same JWT authentication and database.
