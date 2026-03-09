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

1. **Configure Server URL**: On first launch, enter your backend server URL (e.g., `https://your-server.com`). This is required before logging in.
2. **Login**: Use the same credentials as the web app (default: `admin` / `Admin@123`).
3. You can change the server URL later in **Settings**.

## Building APK

### Option 1: EAS Build (Cloud - Recommended)

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login` (create free Expo account if needed)
3. Build APK:
   ```bash
   eas build --platform android --profile preview
   ```
4. Download the APK from the link provided when the build completes.
5. Transfer to your Android device and install (enable "Install from unknown sources" if prompted).

### Option 2: Local Build

Requires Android Studio and Android SDK:

```bash
npx expo run:android
```

This produces a debug APK in `android/app/build/outputs/apk/`.

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

Both the mobile app and web app connect to the same backend API. Deploy your .NET server (e.g., to Azure, Railway, or a VPS), then:

1. Web app: Deploy the built `tenants.client/dist` to your server (or serve it from the same host).
2. Mobile app: Enter the server URL in the app (e.g., `https://your-domain.com`).

Both clients use the same JWT authentication and database.
