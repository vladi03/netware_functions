import { FieldValue } from "firebase-admin/firestore";

import { firestore } from "./firestore.js";

export const addDocNoId = async (collectionId, data) => {
  const res = await firestore.collection(collectionId).add({
    ...data,
    createDate: FieldValue.serverTimestamp(),
  });
  return { id: res.id, ref: res };
};

export const addDocSetId = async (collectionId, data) => {
  const _id = firestore.collection(collectionId).doc().id;
  const docRef = firestore.doc(`${collectionId}/${_id}`);
  await docRef.set({ ...data, _id });
  return { id: _id, ref: docRef };
};

export const uploadFireStoreMergeByRef = async (ref, data) => {
  await ref.set({ ...data }, { merge: true });
  return true;
};

export const uploadFirestoreAndMerge = async (collection, id, data) => {
  const docRef = firestore.collection(collection).doc(id);
  await docRef.set(data, { merge: true });
  return true;
};
