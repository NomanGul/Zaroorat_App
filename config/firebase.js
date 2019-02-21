import firebase from "firebase";
import { firebaseConfig, facebookConfig } from "../constants/Credentials";
import "firebase/firestore";
import "firebase/auth";

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

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
          // AsyncStorage.setItem('providerId',res.user.uid);
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
    const res = doc.set(userData, { merge: true });
    res.then(response => resolve(response)).catch(err => reject(err));
  });
};

export const fetchAllUsers = () => {
  return new Promise((resolve, reject) => {
    const doc = firestore.collection("users").get();
    doc
      .then(response => {
        const users = [];
        response.forEach(user => {
          users.push(user.data());
        });
        resolve(users);
      })
      .catch(err => reject(err));
  });
};

export const fetchServiceByUser = users => {
  return new Promise((resolve, reject) => {
    const allPromises = fetchServices(users);
    Promise.all(allPromises)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

export const fetchServices = users => {
  const promises = users.map(item => {
    return firestore
      .collection("services")
      .where("providerId", "==", item.uid)
      .get();
  });
  return promises;
};

export const setUserLocation = (location, uid) => {
  return firestore
    .collection("users")
    .doc(uid)
    .set({ location }, { merge: true });
};
export const uploadImagesToStorage = image => {
  console.log("images", image);
  let storageRef = storage.ref();
  let promises = [];
  promises.push(
    new Promise((resolve, reject) => {
      const blob = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
          resolve(xhr.response);
        };
        xhr.onerror = function(e) {
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", image, true);
        xhr.send(null);
      });

      blob.then(result => {
        let imgRef = storageRef.child("/images/" + Math.random() + ".jpg");
        imgRef
          .put(result)
          .then(function(snapshot) {
            imgRef.getDownloadURL().then(function(url) {
              resolve(url);
            });
          })
          .catch(err => reject(err));
      });
    })
  );

  return promises;
};

export const addServiceToFirestore = (
  providerId,
  title,
  category,
  phone,
  description,
  thumbnail
) => {
  return db
    .collection("services")
    .doc(providerId.toString())
    .set({
      providerId,
      title,
      category,
      phone,
      description,
      thumbnail
    });
};
