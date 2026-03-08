# Firebase OAuth Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add a **Web app** (Project Settings → Your apps → Add app → Web)

## 2. Configure Firebase in the App

Copy your config from Firebase Console → Project Settings → General → Your apps and update `app/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## 3. Enable Firebase Authentication (Required First!)

**If you see "authentication is not found" or "configuration not found":**

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Click **Build** → **Authentication** in the left sidebar
3. Click **Get started** (this enables the Auth service)
4. After that, go to the **Sign-in method** tab

## 4. Enable Sign-In Providers

In Firebase Console → **Authentication** → **Sign-in method**:

| Provider | Steps |
|----------|-------|
| **Google** | Enable, add support email |
| **Facebook** | Enable, add App ID & App Secret from [developers.facebook.com](https://developers.facebook.com/) |
| **Twitter** | Enable, add API Key & Secret from [developer.twitter.com](https://developer.twitter.com/) |
| **GitHub** | Enable, add Client ID & Secret from [GitHub Developer Settings](https://github.com/settings/developers) |
| **Email/Password** | Enable |

**For Google:** Click Google → toggle **Enable** → add a support email → Save.

### Authorized Domains

Add your domain(s) in **Authentication** → **Settings** → **Authorized domains** (e.g. `localhost` for local testing).

### For Netlify deployment (important!)

Add your Netlify domain to Authorized domains or sign-in will fail:

1. Deploy to Netlify and note your site URL (e.g. `your-site.netlify.app`)
2. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Enter your Netlify subdomain only: `your-site.netlify.app` (no `https://` or path)
5. If you use a custom domain, add that too (e.g. `app.yourdomain.com`)

**Troubleshooting "authentication is not found":**
- Ensure you clicked **Get started** in the Authentication tab (step 3 above)
- Ensure **Google** is enabled under Sign-in method
- Add `localhost` to Authorized domains if testing locally

## 5. Backend Setup (Optional – Token Verification)

For server-side token verification:

### Install dependencies

```bash
cd server
npm install
```

### Get a Service Account Key

1. Firebase Console → Project Settings → **Service accounts**
2. Click **Generate new private key**
3. Save as `server/serviceAccountKey.json`

### Run the server

```bash
# Option A: Use service account file
set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
npm start

# Option B: Use env var with JSON (for hosted deploy)
# Set FIREBASE_SERVICE_ACCOUNT to the JSON string
npm start
```

Server runs at `http://localhost:3000` and serves the app. Use `http://localhost:3000` as the authorized domain in Firebase if testing locally.

## 6. Testing Without Backend

You can use the app without the Node.js backend by opening `app/index.html` or `app/login.html` directly (or via any static server). Firebase Auth works client-side; the backend is only for verifying tokens in custom APIs.
