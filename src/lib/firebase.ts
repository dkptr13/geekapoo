import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// App Check es opcional: solo se inicializa si hay una clave de
// reCAPTCHA v3 en el entorno. Así el build y el emulador siguen
// funcionando sin ella, y activarlo es una decisión de despliegue
// (clave + enforcement en Firebase Console), no un cambio de código.
// Sin clave, App Check NO protege nada: las reglas y las Functions
// siguen siendo la única barrera.
const appCheckKey = import.meta.env.VITE_FIREBASE_APP_CHECK_KEY;
if (appCheckKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Cloud Functions. Se usa para lo que el cliente NO puede decidir
// por sí mismo: en la gamificación, conceder XP y medallas. Lo
// de aquí es solo el punto de entrada; las comprobaciones de
// verdad (que seas del equipo, que no repitas una recompensa)
// están en el servidor, en `functions/src/index.ts`.
export const functions = getFunctions(app);
export const githubProvider = new GithubAuthProvider();

// Se personalizan dos cosas: que aparezca el botón "Continuar con
// Google" en la ventana de Google (en vez de entrar con la cuenta
// ya iniciada sin más) y que pida el correo, que es justo el dato
// con el que se crea el perfil de usuario.
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });