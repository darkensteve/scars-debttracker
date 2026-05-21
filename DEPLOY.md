# Deploy SCARS backend (free tier)

The app needs a live API so each account’s data is saved in the cloud. Use these **free** services:

| Service | Free tier | Purpose |
|---------|-----------|---------|
| [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) | M0 cluster (512 MB) | Database |
| [Render](https://render.com) | Free web service | Host Node API |

## 1. MongoDB Atlas (free)

1. Create a free **M0** cluster.
2. Database Access → add a user with password.
3. Network Access → **Allow access from anywhere** (`0.0.0.0/0`) so Render can connect.
4. Connect → Drivers → copy the connection string, e.g.  
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/debttracker?retryWrites=true&w=majority`

## 2. Deploy API on Render (free)

1. Push `debttracker` to GitHub (include the `backend` folder).
2. Render → **New** → **Web Service** → connect the repo.
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Environment variables:

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | Long random string (e.g. 32+ chars) |
   | `NODE_ENV` | `production` |

5. Deploy. Copy the URL, e.g. `https://scars-api.onrender.com`

> Free Render services **sleep** after ~15 minutes idle. The first request after sleep may take 30–60 seconds.

## 3. Point the app at your API

In `debttracker/.env`:

```env
EXPO_PUBLIC_API_URL=https://your-service.onrender.com
```

Restart Expo (`npx expo start`). Rebuild the APK so the URL is baked in:

```bash
cd debttracker
npx eas-cli build --platform android --profile preview
```

## 4. Local testing

```bash
# Terminal 1 – API
cd backend
npm install
# Create backend/.env with MONGODB_URI and JWT_SECRET
npm run dev

# Terminal 2 – app
cd ..
# .env → EXPO_PUBLIC_API_URL=http://localhost:5000  (web)
# Android emulator → http://10.0.2.2:5000
npx expo start
```

## What users do in the app

1. **Create account** (email + password) — data is stored under that account.
2. **Sign in** on another device — same contacts and transactions load from the cloud.
3. Existing **local-only** data on the phone is uploaded automatically on first sign-up/sign-in (if the cloud account is empty).

PIN lock remains on the device; the **account** protects data in the cloud.
