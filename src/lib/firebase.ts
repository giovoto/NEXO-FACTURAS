
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-IiiSCLemFePVVg0lECTBvW9WAjFWkJw",
  authDomain: "facturascan-kt84f.firebaseapp.com",
  databaseURL: "https://facturascan-kt84f-default-rtdb.firebaseio.com",
  projectId: "facturascan-kt84f",
  storageBucket: "facturascan-kt84f.appspot.com",
  messagingSenderId: "186690054441",
  appId: "1:186690054441:web:50625f4e6f9bdbb3c56f38"
};

// --- Robust Firebase Initialization ---
function initializeClientApp(): FirebaseApp {
    if (getApps().length > 0) {
        return getApp();
    }
    
    if (!firebaseConfig.projectId) {
        console.error("Firebase config is not set. Please check your environment variables.");
        throw new Error("Firebase configuration is missing the projectId.");
    }
    
    return initializeApp(firebaseConfig);
}

const app: FirebaseApp = initializeClientApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

// This ensures the user session is persisted in the browser
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});


export { app, auth, db, googleProvider };
