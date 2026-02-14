import { initializeApp } from "firebase/app";

export const firebaseApp = initializeApp({
  apiKey: process.env.NO_FIREBASE_APP_API_KEY,
  authDomain: process.env.NO_FIREBASE_APP_AUTH_DOMAIN,
  projectId: process.env.NO_FIREBASE_APP_PROJECT_ID,
});
