# Property Manager - Mobile App

React Native + Expo mobile app for Property Manager. Authenticates with **Supabase** and calls the **Next.js API** in `tenants-web/`.

## Prerequisites

- Node.js 18+
- Expo Go (device testing) or Android emulator
- A running `tenants-web` deployment (local or Vercel)
- Supabase project with the schema from `supabase/migrations/001_schema.sql`

## Setup

1. Install dependencies:

   ```bash
   cd tenants.mobile
   npm install
   ```

2. Configure environment (copy from `tenants-web/.env.local` for Supabase values):

   ```bash
   cp .env.example .env
   ```

   Fill in:

   ```
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3000   # optional default API URL
   ```

3. Start the web API locally (in another terminal):

   ```bash
   cd tenants-web
   npm run dev
   ```

4. Start Expo:

   ```bash
   npm start
   ```

5. Run on Android: press `a` in the terminal, or scan the QR code with Expo Go.

## First Launch

1. **API URL**: On first launch, enter your `tenants-web` URL (e.g. `http://192.168.x.x:3000` for local dev, or your Vercel URL). You can change it later in **Settings**.
2. **Login**: Use the same **email and password** as the web app (Supabase Auth user).

> On a physical phone, use your computer's LAN IP — `localhost` will not work.

## Building & Installing APK

See [EAS Build](#option-1-eas-build-cloud---recommended) below, or run locally with `npx expo run:android`.

### Option 1: EAS Build (Cloud - Recommended)

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in: `eas login`
3. Build: `eas build --platform android --profile preview`
4. Install the APK from the build link.

### Option 2: Local Build

```bash
npx expo prebuild
npx expo run:android
```

## Project Structure

```
tenants.mobile/
├── app/                    # Expo Router screens only
│   ├── _layout.tsx
│   ├── login.tsx
│   └── (app)/              # Authenticated screens
├── src/                    # Shared code (not routes)
│   ├── api.ts
│   ├── supabase.ts
│   ├── config.ts
│   ├── context/
│   └── components/
├── .env.example
└── eas.json
```

## How Auth Works

1. **Supabase** — `signInWithPassword` stores the session in AsyncStorage and refreshes tokens automatically.
2. **API calls** — Each request to `tenants-web` `/api/*` includes `Authorization: Bearer <access_token>`.
3. **Web app** — Browser sessions still use cookies; mobile uses Bearer tokens. Both hit the same Supabase-backed API.

## Features

- Properties list with bill summary
- Property detail: floors, tenants, bills, utility connections
- Add/edit/delete properties, floors, tenants, utilities
- Collect rent, manage rent increase rules
- Bills: filter by month, mark paid/unpaid, view snapshot
- Scrape Now for bill fetching
- Dark/light theme
