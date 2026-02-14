import admin from "firebase-admin";
import { createRequire } from "module";

export const importFile = createRequire(import.meta.url);

const initAdmin = () => {
  if (process.env.ENVIRONMENT === "Local") {
    const serviceAccount = importFile("./SA.json");
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "",
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
};

export const firestore = initAdmin().firestore();

export const firebaseAdmin = admin;

export const isFirestoreProd = () => process.env.ENVIRONMENT === "prod";
