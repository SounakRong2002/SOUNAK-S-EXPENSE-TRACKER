const AUTH_STORAGE_KEY = "expenseTrackerUsers";
const CURRENT_USER_KEY = "expenseTrackerCurrentUser";
const USE_FIREBASE = typeof firebase !== "undefined" && typeof initFirebase === "function";

/* ----- Fallback (no Firebase): localStorage auth ----- */
function getUsers() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}

function setCurrentUser(user) {
  if (user) {
    const data = typeof user === "string" ? user : JSON.stringify({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
    });
    localStorage.setItem(CURRENT_USER_KEY, data);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.uid ? parsed : { uid: raw, email: raw, displayName: raw };
  } catch {
    return { uid: raw, email: raw, displayName: raw };
  }
}

function isLoggedIn() {
  return !!localStorage.getItem(CURRENT_USER_KEY);
}

function register(email, password) {
  const users = getUsers();
  if (users[email]) {
    return { success: false, error: "An account with this email already exists." };
  }
  users[email] = password;
  saveUsers(users);
  return { success: true };
}

function login(email, password) {
  const users = getUsers();
  if (!users[email]) {
    return { success: false, error: "No account found. Please sign up first." };
  }
  if (users[email] !== password) {
    return { success: false, error: "Incorrect password." };
  }
  setCurrentUser({ uid: email, email, displayName: email });
  return { success: true };
}

function logout() {
  if (USE_FIREBASE && auth) {
    auth.signOut().catch(() => {});
  }
  setCurrentUser(null);
}

/* ----- Firebase Auth integration ----- */
async function firebaseEmailSignUp(email, password) {
  if (!auth) return { success: false, error: "Firebase not configured." };
  try {
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    setCurrentUser(cred.user);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || "Sign up failed." };
  }
}

async function firebaseEmailSignIn(email, password) {
  if (!auth) return { success: false, error: "Firebase not configured." };
  try {
    const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
    setCurrentUser(cred.user);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || "Sign in failed." };
  }
}

async function firebaseSignInWithProvider(providerId) {
  if (!auth) return { success: false, error: "Firebase not configured." };
  let provider;
  switch (providerId) {
    case "google":
      provider = new firebase.auth.GoogleAuthProvider();
      break;
    case "facebook":
      provider = new firebase.auth.FacebookAuthProvider();
      break;
    case "twitter":
      provider = new firebase.auth.TwitterAuthProvider();
      break;
    case "github":
      provider = new firebase.auth.GithubAuthProvider();
      break;
    default:
      return { success: false, error: "Unknown provider." };
  }
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    setCurrentUser(result.user);
    return { success: true };
  } catch (e) {
    let msg = "Sign-in failed.";
    if (e.code === "auth/popup-closed-by-user") msg = "Sign-in was cancelled.";
    else if (e.code === "auth/operation-not-allowed") msg = "Google sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.";
    else if (e.code === "auth/configuration-not-found" || (e.message && e.message.toLowerCase().includes("configuration"))) msg = "Auth not set up. In Firebase Console: 1) Go to Authentication → Get started 2) Enable Google in Sign-in method.";
    else if (e.message) msg = e.message;
    return { success: false, error: msg };
  }
}

function getFirebaseIdToken() {
  return auth && auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null);
}

/** Wait for auth to be ready (Firebase or fallback). Resolve before auth guard runs. */
function whenAuthReady() {
  return new Promise((resolve) => {
    if (!USE_FIREBASE || !initFirebase()) {
      resolve();
      return;
    }
    const unsub = firebase.auth().onAuthStateChanged((user) => {
      unsub();
      if (user) setCurrentUser(user);
      resolve();
    });
  });
}

/* ----- Login page logic ----- */
if (document.getElementById("loginFormEl")) {
  const firebaseReady = USE_FIREBASE && initFirebase();

  if (isLoggedIn()) {
    window.location.replace("index.html");
  }

  const loginForm = document.getElementById("loginFormEl");
  const signupForm = document.getElementById("signupFormEl");
  const loginFormDiv = document.getElementById("loginForm");
  const signupFormDiv = document.getElementById("signupForm");
  const loginError = document.getElementById("loginError");
  const signupError = document.getElementById("signupError");

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".auth-form").forEach((f) => f.classList.remove("active"));
      tab.classList.add("active");
      if (target === "login") {
        loginFormDiv.classList.add("active");
        loginError.classList.add("hidden");
      } else {
        signupFormDiv.classList.add("active");
        signupError.classList.add("hidden");
      }
    });
  });

  function showToast(msg) {
    const toast = document.getElementById("authToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loading ? "Please wait…" : btn.dataset.originalText;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    loginError.classList.add("hidden");
    const btn = loginForm.querySelector('button[type="submit"]');
    setLoading(btn, true);

    if (firebaseReady) {
      const result = await firebaseEmailSignIn(email, password);
      setLoading(btn, false);
      if (result.success) {
        window.location.href = "index.html";
      } else {
        loginError.textContent = result.error;
        loginError.classList.remove("hidden");
      }
    } else {
      const result = login(email, password);
      setLoading(btn, false);
      if (result.success) {
        window.location.href = "index.html";
      } else {
        loginError.textContent = result.error;
        loginError.classList.remove("hidden");
      }
    }
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;
    signupError.classList.add("hidden");
    const btn = signupForm.querySelector('button[type="submit"]');
    setLoading(btn, true);

    if (password !== confirm) {
      signupError.textContent = "Passwords do not match.";
      signupError.classList.remove("hidden");
      setLoading(btn, false);
      return;
    }

    if (firebaseReady) {
      const result = await firebaseEmailSignUp(email, password);
      setLoading(btn, false);
      if (result.success) {
        window.location.href = "index.html";
      } else {
        signupError.textContent = result.error;
        signupError.classList.remove("hidden");
      }
    } else {
      const result = register(email, password);
      setLoading(btn, false);
      if (result.success) {
        setCurrentUser({ uid: email, email, displayName: email });
        window.location.href = "index.html";
      } else {
        signupError.textContent = result.error;
        signupError.classList.remove("hidden");
      }
    }
  });

  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.provider;
      btn.disabled = true;
      if (firebaseReady) {
        const result = await firebaseSignInWithProvider(provider);
        if (result.success) {
          window.location.href = "index.html";
        } else {
          showToast(result.error);
        }
      } else {
        showToast("Firebase not configured. Add your config to firebase-config.js");
      }
      btn.disabled = false;
    });
  });
}
