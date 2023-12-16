
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


export const environment = {
  firebaseConfig: {
    projectId: 'datamesh-7b8b8',
    appId: '1:929428536892:web:702db534c10ddc4a024d39',
    storageBucket: 'datamesh-7b8b8.appspot.com',
    locationId: 'us-central',
    apiKey: 'AIzaSyDwQAHWltmVexUHjTvEgP0SkHj05NIyzLw',
    authDomain: 'datamesh-7b8b8.firebaseapp.com',
    messagingSenderId: '929428536892',
  },
};


export const baseUrl = "http://192.168.1.14:5000/"
// Initialize Firebase
const app = initializeApp(environment.firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);
  