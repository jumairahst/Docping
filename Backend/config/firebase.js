const path = require('path');
const admin = require('firebase-admin');

let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
  const resolved = path.resolve(process.cwd(), serviceAccountPath);

  const options = {
    credential: admin.credential.cert(resolved),
  };
  if (process.env.FIREBASE_DATABASE_URL) {
    options.databaseURL = process.env.FIREBASE_DATABASE_URL;
  }

  try {
    firebaseApp = admin.initializeApp(options);
    console.log('Firebase Admin initialized');
  } catch (err) {
    if (err.code === 'app/duplicate-app') {
      firebaseApp = admin.app();
    } else {
      throw new Error(
        `Failed to initialize Firebase Admin. Check FIREBASE_SERVICE_ACCOUNT_PATH in .env ` +
          `(expected service account JSON at ${resolved}). Original error: ${err.message}`
      );
    }
  }
  return firebaseApp;
};

const getAuth = () => initFirebase().auth();

module.exports = { initFirebase, getAuth };
