import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import {
  auth,
  db,
  githubProvider,
  googleProvider,
} from '../lib/firebase';

import { toIsoString } from '../services/firestoreUtils';

import { User } from '../types';


// ======================================================
// TIPOS
// ======================================================

export interface AuthContextType {
  currentUser: User | null;
  usersList: User[];
  loading: boolean;
  getUserByChatId: (chatId: string) => User | undefined;

  isAdmin: boolean;
  isModerator: boolean;
  canManage: boolean;

  login: (
    email: string,
    pass: string
  ) => Promise<{
    ok: boolean;
    error?: string;
  }>;

  loginWithGithub: () => Promise<{
    ok: boolean;
    error?: string;
  }>;

  loginWithGoogle: () => Promise<{
    ok: boolean;
    error?: string;
  }>;

  register: (
    email: string,
    pass: string,
    username: string
  ) => Promise<{
    ok: boolean;
    error?: string;
  }>;

  logout: () => Promise<void>;

  sendPasswordReset: (
    email: string
  ) => Promise<{
    ok: boolean;
    error?: string;
  }>;

  updateProfileData: (
    data: Partial<User>
  ) => Promise<void>;

  authModalOpen: boolean;

  authMode:
    | 'login'
    | 'register'
    | 'recover';

  returnToAction: string | null;

  openAuth: (
    mode?:
      | 'login'
      | 'register'
      | 'recover',
    returnTo?: string
  ) => void;

  closeAuth: () => void;

  requireAuth: (
    actionDescription?: string,
    onAuthenticated?: () => void
  ) => boolean;
}


// ======================================================
// CONTEXT
// ======================================================

// ======================================================
// ERRORES DEL LOGIN CON GITHUB
// ======================================================
// Casi todos los fallos de este botón NO son un problema del
// código: son la consola de Firebase y la app OAuth de GitHub
// sin configurar, o el navegador bloqueando la ventana.
//
// Antes solo se reconocían tres códigos y todo lo demás salía
// como "Error al iniciar sesión con GitHub", que no dice nada.
// Ahora cada causa explica qué hay que arreglar, y si el código
// no es de los conocidos se muestra tal cual, que es lo único
// que sirve para diagnosticarlo en la consola del navegador.

/**
 * Errores de los inicios de sesión con ventana emergente (Google y
 * GitHub).
 *
 * Se comparten los dos porque los códigos que devuelve Firebase son
 * los mismos: lo único que cambia es a qué proveedor se le está
 * pidiendo. Por eso los textos llevan "{p}" en lugar de decir
 * siempre "GitHub", que es lo que fallaba antes: al usar esta tabla
 * con Google, un "operación no permitida" DPDía de "activa el
 * método GitHub", y el mensaje mandaba a un sitio donde no hay
 * nada que activar.
 */
const ERRORES_POPUP: Record<string, string> = {
  'auth/popup-closed-by-user':
    'Se cerró la ventana de {p} antes de terminar. Inténtalo de nuevo y no la cierres.',

  'auth/popup-blocked':
    'El navegador bloqueó la ventana de {p}. Permite las ventanas emergentes para este ' +
    'sitio (icono del candado en la barra de direcciones) o prueba con otro navegador.',

  'auth/cancelled-popup-request':
    'Se abrió una ventana de {p} justo cuando ya había otra. Espera a que termine la primera.',

  'auth/account-exists-with-different-credential':
    'Ya hay una cuenta con ese correo creada con otro método. Entra con correo y contraseña, ' +
    'o usa el mismo botón con el que te registraste la primera vez.',

  'auth/unauthorized-domain':
    'Este dominio no está autorizado. En la consola de Firebase: Authentication → Settings → ' +
    'Authorized domains, y añade aquí el dominio tal cual aparece en la barra de direcciones ' +
    'de la web (por ejemplo, geekapoo.vercel.app).',

  'auth/operation-not-allowed':
    'El método {p} está apagado. En la consola de Firebase: Authentication → Sign-in ' +
    'method → {p}, y actívalo.',

  'auth/configuration-not-found':
    'Falta la configuración de {p}. En la consola de Firebase: Authentication → Sign-in ' +
    'method → {p}, y complétala antes de usarla.',

  'auth/network-request-failed':
    'No se pudo contactar con {p}. Revisa la conexión o el bloqueador de anuncios.',

  'auth/web-storage-unsupported':
    'El navegador está bloqueando el almacenamiento que necesita Firebase para guardar la ' +
    'sesión. Suele pasar con las cookies de terceros bloqueadas o en navegación privada. ' +
    'Prueba en una ventana normal o con otro navegador.',

  'auth/internal-error':
    'Error interno de Firebase al abrir la ventana. Prueba con otro navegador; si sigue, ' +
    'reinicia la sesión en Authentication → Users.',
};

function mensajeErrorPopup(err: unknown, provider: 'Google' | 'GitHub'): string {
  const code = (err as { code?: string })?.code;
  const plantilla = code ? ERRORES_POPUP[code] : undefined;

  if (plantilla) return plantilla.replaceAll('{p}', provider);

  const sucio = (err as { message?: string })?.message
    ? ` (${(err as { message: string }).message})`
    : '';

  return code
    ? `No se pudo iniciar sesión con ${provider} [${code}]${sucio}`
    : `No se pudo iniciar sesión con ${provider}${sucio}`;
}

// ======================================================
// CONTEXTO
// ======================================================

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);


// ======================================================
// PROPS
// ======================================================

interface AuthProviderProps {
  children: React.ReactNode;
}


// ======================================================
// PROVIDER
// ======================================================

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {

  // ====================================================
  // ESTADOS
  // ====================================================

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [usersList, setUsersList] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [authModalOpen, setAuthModalOpen] =
    useState<boolean>(false);

  const [authMode, setAuthMode] =
    useState<
      'login' | 'register' | 'recover'
    >('login');

  const [returnToAction, setReturnToAction] =
    useState<string | null>(null);

  // El directorio de usuarios se carga DESPUÉS de resolver la
  // sesión, nunca en el montaje.
  //
  // Antes este listener tenía dependencias [] y arrancaba de
  // inmediato, cuando Firebase Auth todavía no había confirmado
  // quién eres. La regla de /users exige isSignedIn(), así que la
  // lectura llegaba sin token, devolvía permission-denied, y el
  // manejador de error vaciaba la lista. Como las dependencias
  // estaban vacías, no se volvía a intentar nunca: el directorio
  // se quedaba vacío para siempre y "añadir a un usuario por su
  // ID" no encontraba a nadie.
  //
  // La dependencia es el uid, y no el usuario entero: como el
  // documento propio se escucha en vivo, `currentUser` cambia de
  // identidad con cada XP o medalla nueva, y con el objeto entero
  // aquí se re-suscribiría el directorio entero cada vez.
  useEffect(() => {
    if (!currentUser) {
      setUsersList([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const directory = snapshot.docs
          .map((userDoc) => {
            const data = userDoc.data() as User & { isBanned?: boolean };
            return {
              ...data,
              // La fecha se guarda como Timestamp y aquí vuelve a
              // texto ISO, para no meter un objeto en un campo
              // declarado como string.
              createdAt: toIsoString(data.createdAt),
            };
          })
          // Un usuario baneado no puede escribir en los chats, así
          // que no tiene sentido ofrecerlo para añadir a un grupo.
          .filter((u) => u.isBanned !== true)
          .sort((a, b) => a.username.localeCompare(b.username));

        setUsersList(directory);
      },
      (error) => {
        console.error(
          '[Auth] No se pudo cargar el directorio de usuarios:',
          error,
        );
        setUsersList([]);
      }
    );

    return unsubscribe;
  }, [currentUser?.uid]);


  // ====================================================
  // ESCUCHAR ESTADO DE AUTENTICACIÓN
  // ====================================================
  //
  // El documento propio se ESCUCHA (`onSnapshot`), no se lee una
  // vez con `getDoc`. Antes era una sola lectura al entrar, y el
  // perfil seguía enseñando el XP y el nivel viejos hasta
  // recargar: si el nivel cambiaba al publicar un hilo, la
  // cabecera no se enteraba (ver `escucharProgreso` en
  // `services/gamification.ts`, que ya lo advertía).

  useEffect(() => {

    let pararDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(
      auth,
      (fbUser: FirebaseUser | null) => {

        pararDoc?.();
        pararDoc = null;

        if (!fbUser) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const isPasswordUser =
          fbUser.providerData.some(
            (provider) =>
              provider.providerId === 'password'
          );

        if (isPasswordUser && !fbUser.emailVerified) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', fbUser.uid);

        pararDoc = onSnapshot(
          userDocRef,
          (userDoc) => {

            // ✅ LOG AÑADIDO AQUÍ
            console.log('perfil en vivo - ¿Existe doc?', userDoc.exists());
            console.log('perfil en vivo - UID:', fbUser.uid);

            if (userDoc.exists()) {

              const firestoreUser = userDoc.data() as User;

              // ✅ LOG AÑADIDO AQUÍ
              console.log('perfil en vivo - XP:', firestoreUser.xp, 'NIVEL:', firestoreUser.level);

              // La fecha se guarda como Timestamp y aquí vuelve a
              // texto ISO, igual que en el directorio de usuarios
              // de arriba: si no, un `serverTimestamp` recién
              // escrito llegaría como objeto y no como string.
              setCurrentUser({
                ...firestoreUser,
                createdAt: toIsoString(firestoreUser.createdAt),
              });

            } else {

              const username =
                fbUser.displayName
                  ?.replace(/\s+/g, '_')
                  .trim() ||
                fbUser.email?.split('@')[0] ||
                'UserGeek';

              const newUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                username,
                displayName: fbUser.displayName || username,
                chatId: `GK-${Math.floor(1000 + Math.random() * 9000)}-${username.substring(0, 4).toUpperCase()}`,
                avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                role: 'user',
                isBanned: false,
                createdAt: new Date().toISOString(),
                lastSeen: 'En línea',
                bio: 'Comunidad geekapoo.com',
              };

              // Al escribir, este mismo listener salta de nuevo y
              // pone el documento ya creado. No se espera aquí.
              setDoc(userDocRef, {
                ...newUser,
                createdAt: serverTimestamp(),
              }).catch((e) => console.error('Error al crear el perfil de Firestore:', e));

              // ✅ LOG AÑADIDO AQUÍ
              console.log('perfil en vivo - Perfil nuevo creado con rol:', newUser.role);

              setCurrentUser(newUser);
            }

            setLoading(false);
          },
          (error) => {
            console.error('Error al escuchar el perfil de Firestore:', error);
            setLoading(false);
          },
        );
      }
    );

    return () => {
      pararDoc?.();
      unsubscribe();
    };

  }, []);


  // ====================================================
  // ABRIR MODAL DE AUTENTICACIÓN
  // ====================================================

  const openAuth = (
    mode: 'login' | 'register' | 'recover' = 'login',
    returnTo?: string
  ): void => {
    setAuthMode(mode);
    setReturnToAction(returnTo || null);
    setAuthModalOpen(true);
  };


  // ====================================================
  // CERRAR MODAL
  // ====================================================

  const closeAuth = (): void => {
    setAuthModalOpen(false);
    setReturnToAction(null);
  };


  // ====================================================
  // REQUERIR AUTENTICACIÓN
  // ====================================================

  const requireAuth = (
    actionDescription?: string,
    onAuthenticated?: () => void
  ): boolean => {

    if (!currentUser) {
      openAuth('login', actionDescription);
      return false;
    }

    if (onAuthenticated) {
      onAuthenticated();
    }

    return true;
  };


  // ====================================================
  // LOGIN CON EMAIL Y CONTRASEÑA
  // ====================================================

  const login = async (
    email: string,
    pass: string
  ): Promise<{ ok: boolean; error?: string }> => {

    try {

      const userCredential =
        await signInWithEmailAndPassword(auth, email.trim(), pass);

      const fbUser = userCredential.user;

      if (!fbUser.emailVerified) {
        await signOut(auth);
        return {
          ok: false,
          error: 'Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada y haz clic en el enlace de verificación.',
        };
      }

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);

      // ✅ LOG AÑADIDO AQUÍ
      console.log('login() - ¿Existe doc?', userDoc.exists());
      console.log('login() - UID:', fbUser.uid);

      if (userDoc.exists()) {

        const firestoreUser = userDoc.data() as User;

        // ✅ LOG AÑADIDO AQUÍ
        console.log('login() - USUARIO FIRESTORE:', firestoreUser);
        console.log('login() - ROL:', firestoreUser.role);

        setCurrentUser(firestoreUser);

      } else {

        const username =
          fbUser.displayName ||
          fbUser.email?.split('@')[0] ||
          'UserGeek';

        const newUser: User = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          username: username.replace(/\s+/g, '_'),
          displayName: username,
          chatId: `GK-${Math.floor(1000 + Math.random() * 9000)}-${username.substring(0, 4).toUpperCase()}`,
          avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          role: 'user',
          isBanned: false,
          createdAt: new Date().toISOString(),
          lastSeen: 'En línea',
          bio: 'Comunidad geekapoo.com',
        };

        await setDoc(userDocRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });

        // ✅ LOG AÑADIDO AQUÍ
        console.log('login() - Perfil nuevo creado con rol:', newUser.role);

        setCurrentUser(newUser);
      }

      closeAuth();
      return { ok: true };

    } catch (err: any) {

      console.error('Error al iniciar sesión:', err);

      let message = 'Error al iniciar sesión.';

      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        message = 'Correo o contraseña incorrectos.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos fallidos. Inténtalo más tarde.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido.';
      }

      return { ok: false, error: message };
    }
  };


  // ====================================================
  // REGISTRO
  // ====================================================

  const register = async (
    email: string,
    pass: string,
    username: string
  ): Promise<{ ok: boolean; error?: string }> => {

    try {

      const userCredential =
        await createUserWithEmailAndPassword(auth, email.trim(), pass);

      const fbUser = userCredential.user;

      await sendEmailVerification(fbUser);

      const cleanUsername = username.trim();

      const chatId =
        `GK-${Math.floor(1000 + Math.random() * 9000)}-${cleanUsername.substring(0, 4).toUpperCase()}`;

      const newUser: User = {
        uid: fbUser.uid,
        email: email.trim(),
        username: cleanUsername,
        displayName: cleanUsername,
        chatId,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        role: 'user',
        isBanned: false,
        createdAt: new Date().toISOString(),
        lastSeen: 'En línea',
        bio: 'Nuevo miembro en geekapoo.com',
      };

      await setDoc(
        doc(db, 'users', fbUser.uid),
        { ...newUser, createdAt: serverTimestamp() }
      );

      await signOut(auth);
      setCurrentUser(null);
      closeAuth();

      alert('¡Cuenta creada con éxito! Te hemos enviado un correo de verificación. Por favor, revisa tu bandeja de entrada (o Spam) y haz clic en el enlace para poder iniciar sesión.');

      return { ok: true };

    } catch (err: any) {

      console.error('Error durante el registro:', err);

      let message = 'Error durante el registro.';

      if (err?.code === 'auth/email-already-in-use') {
        message = 'Este correo ya está registrado. Inicia sesión.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'La contraseña debe tener mínimo 6 caracteres.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido.';
      } else if (err?.code === 'auth/network-request-failed') {
        message = 'Error de conexión. Comprueba tu conexión a Internet.';
      }

      return { ok: false, error: message };
    }
  };


  // ====================================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ====================================================

  const sendPasswordReset = async (
    email: string
  ): Promise<{ ok: boolean; error?: string }> => {

    try {

      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };

    } catch (err: any) {

      console.error('Error al recuperar contraseña:', err);

      let message = 'No se pudo enviar el correo de recuperación.';

      if (err?.code === 'auth/user-not-found') {
        message = 'No existe ninguna cuenta registrada con este correo electrónico.';
      } else if (err?.code === 'auth/invalid-email') {
        message = 'El correo electrónico no es válido.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.';
      }

      return { ok: false, error: message };
    }
  };


  // ====================================================
  // LOGIN CON GITHUB
  // ====================================================

  const loginWithGithub = async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {

    try {

      await signInWithPopup(auth, githubProvider);
      closeAuth();
      return { ok: true };

    } catch (err: any) {

      console.error('Error al iniciar sesión con GitHub:', err);

      return { ok: false, error: mensajeErrorPopup(err, 'GitHub') };
    }
  };


  // ====================================================
  // LOGIN CON GOOGLE
  // ====================================================
  //
  // No hace falta crear el usuario a mano: al entrar, el listener
  // de onAuthStateChanged ve que no hay documento en "users" y lo
  // crea con los datos de Google. Por eso el login con GitHub
  // tampoco los escribe.

  const loginWithGoogle = async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {

    try {

      await signInWithPopup(auth, googleProvider);
      closeAuth();
      return { ok: true };

    } catch (err: unknown) {

      console.error('Error al iniciar sesión con Google:', err);

      return { ok: false, error: mensajeErrorPopup(err, 'Google') };
    }
  };


  // ====================================================
  // CERRAR SESIÓN
  // ====================================================

  const logout = async (): Promise<void> => {

    try {

      await signOut(auth);
      setCurrentUser(null);

    } catch (error) {

      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };


  // ====================================================
  // ACTUALIZAR PERFIL
  // ====================================================

  const updateProfileData = async (
    data: Partial<User>
  ): Promise<void> => {

    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);

    const updatedUser: User = {
      ...currentUser,
      ...data,
    };

    await setDoc(userRef, data, { merge: true });

    setCurrentUser(updatedUser);
  };

  const getUserByChatId = (chatId: string): User | undefined => {
    const normalized = chatId.trim().toLowerCase();
    if (!normalized) return undefined;

    // Comparación con cadena opcional: un usuario sin chatId
    // guardado no debe romper la búsqueda entera.
    return usersList.find(
      (user) =>
        user.chatId?.toLowerCase() === normalized ||
        user.uid?.toLowerCase() === normalized ||
        user.username?.toLowerCase() === normalized
    );
  };


  // ====================================================
  // VALOR DEL CONTEXTO
  // ====================================================

  const contextValue: AuthContextType = {
    currentUser,
    usersList,
    loading,
    getUserByChatId,
    isAdmin: currentUser?.role === 'admin',
    isModerator: currentUser?.role === 'moderator' || currentUser?.role === 'admin',
    canManage: currentUser?.role === 'admin' || currentUser?.role === 'moderator',
    login,
    loginWithGithub,
    loginWithGoogle,
    register,
    logout,
    sendPasswordReset,
    updateProfileData,
    authModalOpen,
    authMode,
    returnToAction,
    openAuth,
    closeAuth,
    requireAuth,
  };


  // ====================================================
  // PROVIDER
  // ====================================================

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};


// ======================================================
// HOOK useAuth
// ======================================================

export const useAuth = (): AuthContextType => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
};