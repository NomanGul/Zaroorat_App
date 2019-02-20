import firebase from "firebase";
import { firebaseConfig, facebookConfig } from "../constants/Credentials";
import "firebase/firestore";
import "firebase/auth";

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
const auth = firebase.auth();

export const loginWithFacebook = () => {
  return new Promise(async (resolve, reject) => {
    const { type, token } = await Expo.Facebook.logInWithReadPermissionsAsync(
      facebookConfig.appId,
      {
        permissions: ["public_profile", "email"]
        // 'user_posts'
      }
    );
    if (type === "success") {
      const credencials = firebase.auth.FacebookAuthProvider.credential(token);
      console.log(credencials);
      auth
        .signInAndRetrieveDataWithCredential(credencials)
        .then(res => {
          console.log(res);
          const userData = {
            name: res.user.displayName,
            email: res.user.email,
            photo: `${res.user.photoURL}?type=large`,
            uid: res.user.uid,
            token
          };
          const response = setUser(userData);
          response.then(() => {
            resolve(userData);
          });
        })
        .catch(err => reject(err));
    }
  });
};

export const setUser = userData => {
  return new Promise((resolve, reject) => {
    const doc = firestore.collection("users").doc(userData.uid);
    const res = doc.set(userData);
    res.then(response => resolve(response)).catch(err => reject(err));
  });
};

export const setUserLocation = (location, uid) => {
  return firestore.collection("users").doc(uid).set({ location }, { merge: true })
}
