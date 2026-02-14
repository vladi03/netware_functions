import admin from "firebase-admin";

import { firestore } from "./firestore.js";

export const getRef = (collectionPath, uid) => firestore.doc(`${collectionPath}/${uid}`);

export const getAllInCollection = async (collectionName) => {
  const response = await firestore.collection(collectionName).get();
  return response.docs.map((doc) => ({ id: doc.id, doc: doc.data(), docRef: doc.ref }));
};

export const getItem = async (collection, id) => {
  const ref = firestore.doc(`${collection}/${id}`);
  const doc = await ref.get();
  return { id: doc.id, doc: doc.data(), docRef: doc.ref };
};

export const getUser = async (userId) => getItem("users", userId);

export const getFirebaseToken = async (uid) => admin.auth().createCustomToken(uid);
