import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/database";

const firebaseConfig = {
  apiKey: "AIzaSyDx3TouE9Y5sWETw1givSnYf09B88QsRxU",
  authDomain: "celivox-ai.firebaseapp.com",
  databaseURL: "https://celivox-ai-default-rtdb.firebaseio.com",
  projectId: "celivox-ai",
  storageBucket: "celivox-ai.appspot.com",
  messagingSenderId: "583893605040",
  appId: "1:583893605040:web:44b0c590132062c55cb975"
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = app.auth();
export const database = app.database();