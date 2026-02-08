import {getFirestore} from "firebase-admin/firestore";

/**
 * Get Firestore instance configured for the hackitba database
 * @return {FirebaseFirestore.Firestore} Firestore instance
 */
export const getHackitbaDb = () => {
  return getFirestore("hackitba");
};

