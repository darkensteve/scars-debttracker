# SCARS — loan & payment tracker

A simple mobile app for tracking money people owe you — cash loans, items you bought for them, and payments they make later. Data is stored **only on the phone** (no account or server required).

Built with **Expo SDK 54** and **React Native**, so she can run it on **iPhone or Android** via **Expo Go** (latest version from the App Store / Play Store).

## Features

- **Dashboard** — total amount owed to her, recent activity
- **People** — contacts with running balance (who owes how much)
- **Add transaction** — three types:
  - **Lent cash** — she gave money directly
  - **Bought item** — she paid for something they will repay
  - **Paid you** — they paid part or all of their debt
- **Contact detail** — full history per person, delete mistaken entries
- **Settings** — business name on dashboard, currency symbol (default ₱)

## Preview in your browser (while designing)

Fastest way to see layout changes without picking up your phone:

```powershell
npm.cmd run preview
```

Or, if Expo is already running, press **`w`** in the terminal to open the web preview.

- Opens at **http://localhost:8081** (or the URL shown in the terminal)
- **Hot reload** — save a file and the browser updates automatically
- Shows a **phone-sized frame** so it looks close to the real app
- Data uses the same local storage as the phone build (separate per device/browser)

> Web preview is for development only. Always check once on a real phone before sharing with your sister.

## Run on phone (iPhone or Android)

1. Install [Node.js](https://nodejs.org/) on your computer.
2. Install **Expo Go** from the App Store (iOS) or Google Play (Android).
3. In this folder, run (use `.cmd` if PowerShell blocks scripts):

```powershell
npm.cmd install
npx.cmd expo start
```

4. Scan the QR code with **Expo Go** (Android: tap “Scan QR code” in the app).

> Phone and computer must be on the **same Wi‑Fi**.

### PowerShell: “running scripts is disabled”

Use:

```powershell
npm.cmd install
npx.cmd expo start
```

Or open **Command Prompt** (`cmd`) instead of PowerShell.

### “Incompatible SDK version” in Expo Go

This project uses **Expo SDK 54**. You need the **current** Expo Go app (not an old APK). After pulling updates, run `npm.cmd install` again, then `npx.cmd expo start --clear`.

## Build for App Store (optional, later)

When ready for a real install without Expo Go:

```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

You will need an [Apple Developer](https://developer.apple.com/) account ($99/year) to publish to the App Store.

## Optional backend

The `backend/` folder is an older MongoDB API (login, cloud sync). The app **does not require it** anymore — everything uses local storage.

To run the API locally:

```powershell
# From the project folder (one level above debttracker)
npm.cmd run backend:db
cd backend
copy .env.example .env
npm.cmd install
npm.cmd start
```

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) for the database, or your own MongoDB instance with `MONGODB_URI` in `backend/.env`.

## Project structure

```
App.js                 — navigation shell
app/context/           — data + AsyncStorage
app/screens/           — UI screens
app/components/        — shared UI
```
