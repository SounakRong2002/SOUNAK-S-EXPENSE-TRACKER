const path = require("path");
const express = require("express");
const cors = require("cors");

let admin;
try {
  admin = require("firebase-admin");
} catch (e) {
  console.warn("firebase-admin not installed. Run: npm install");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin
function initFirebaseAdmin() {
  if (!admin) return false;
  try {
    if (admin.apps.length > 0) return true;

    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      const fs = require("fs");
      const keyPath = path.isAbsolute(credPath) ? credPath : path.join(__dirname, credPath);
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        return true;
      }
    }
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(parsed) });
      return true;
    }
    admin.initializeApp();
    return true;
  } catch (e) {
    console.warn("Firebase Admin init failed:", e.message);
    return false;
  }
}

const firebaseReady = initFirebaseAdmin();

// Verify Firebase ID token
async function verifyToken(idToken) {
  if (!firebaseReady || !admin) {
    return { valid: false, error: "Firebase Admin not configured" };
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return { valid: true, uid: decoded.uid, email: decoded.email };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

// API: Verify token
app.post("/api/verify", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }
  const result = await verifyToken(token);
  if (result.valid) {
    res.json({ valid: true, uid: result.uid, email: result.email });
  } else {
    res.status(401).json({ valid: false, error: result.error });
  }
});

// API: Protected example (requires Authorization: Bearer <token>)
app.get("/api/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  const result = await verifyToken(token);
  if (result.valid) {
    res.json({ uid: result.uid, email: result.email });
  } else {
    res.status(401).json({ error: result.error });
  }
});

// Serve static files from ../app
const staticPath = path.join(__dirname, "..", "app");
app.use(express.static(staticPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(staticPath, "login.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!firebaseReady) {
    console.log("Firebase Admin: Not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT");
  }
});
