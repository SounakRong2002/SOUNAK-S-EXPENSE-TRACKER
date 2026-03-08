/**
 * Firebase Configuration
 * Get your config from Firebase Console: Project Settings > General > Your apps
 * https://console.firebase.google.com/
 */
  const firebaseConfig = {
    apiKey: "AIzaSyBOAcglOpfDikMnw11wQcfzBsUoe7WtXqo",
    authDomain: "sounak-s-expense-tracker.firebaseapp.com",
    projectId: "sounak-s-expense-tracker",
    storageBucket: "sounak-s-expense-tracker.firebasestorage.app",
    messagingSenderId: "297242936339",
    appId: "1:297242936339:web:a2eef782aaa337cc7bebe6",
    measurementId: "G-QZSJ30G5L6"
};

// Initialize Firebase (loaded after Firebase SDK)
let auth = null;

function initFirebase() {
  if (typeof firebase === "undefined") {
    return false;
  }
  if (firebaseConfig.apiKey === "YOUR_API_KEY" || !firebaseConfig.projectId || firebaseConfig.projectId.startsWith("YOUR_")) {
    return false;
  }
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (e) {
      return false;
    }
  }
  auth = firebase.auth();
  return true;
}
