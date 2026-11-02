import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import {
  auth,
  db,
  githubProvider,
  googleProvider,
} from '../lib/firebase';
import {
  cachedRead,
  clearPrivateCaches,
  clearUserCache,
  setCached,
  userCacheScope,
} from '../lib/firestoreCache';
import { measureRead, recordListenerSnapshot, trackListener } from '../lib/firestoreDiagnostics';

import { toIsoString } from '../services/firestoreUtils';

import { DEFAULT_PRIVACY, readPrivacy } from '../services/accountSettings';
import { marcarPresencia } from '../services/presence';

import {
  PRIVATE_PROFILE_FIELDS,
  privateFieldsOf,
  publicPrivacySignals,
  soloCamposPublicos,
  subscribeUserPrivate,
  userPrivateRef,
} from '../services/userPrivate';

import { User, PrivacySettings, UserPrivateData } from '../types';


// ======================================================
// REGISTRO DURABLE DE BANEOS
// ======================================================
//
// El baneo de verdad no vive en `users/{uid}.isBanned` (ese
// documento lo puede borrar su dueño), sino en
// `accountRestrictions/{uid}`, que solo escriben las Cloud
// Functions. Se consulta al crear un perfil porque el perfil se
// puede borrar y recrear: sin esta lectura, un baneado que borrase
// su documento volvería con `isBanned: false`.
//
// Si la lectura falla (reglas antiguas, sin conexión...), se
// devuelve `false` y no se inventa un baneo: las reglas de
// Firestore y Storage consultan el registro en cada escritura de
// todos modos.
interface EstadoRestriccion {
  /** Hay un registro duradero, esté activo o levantado. */
  existe: boolean;
  /** Ese registro es un baneo vigente. */
  vigente: boolean;
}

async function estadoRestriccion(uid: string): Promise<EstadoRestriccion> {
  try {
    const snap = await getDoc(doc(db, 'accountRestrictions', uid));
    if (!snap.exists()) return { existe: false, vigente: false };

    const data = snap.data() as { activo?: boolean; tipo?: string };
    return {
      existe: true,
      vigente: data.activo === true && data.tipo === 'ban',
    };
  } catch (e) {
    console.error('[Auth] No se pudo leer el registro de restricciones:', e);
    // Sin lectura no se inventa un baneo. Las reglas consultan el
    // registro en cada escritura de todas formas.
    return { existe: false, vigente: false };
  }
}

/**
 * La restricción duradera manda desde que existe. El campo público
 * `isBanned` solo se usa como respaldo en cuentas que todavía no
 * tienen registro, para no dejar sin efecto un baneo antiguo.
 */
function estaBaneado(
  perfil: { isBanned?: boolean },
  restriccion: EstadoRestriccion,
): boolean {
  return restriccion.existe
    ? restriccion.vigente
    : perfil.isBanned === true;
}


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
// PERFIL PÚBLICO + DATOS PRIVADOS
// ======================================================
//
// `currentUser` es la única vista que mezcla las dos mitades. El
// directorio (`usersList`) se queda solo con el documento público.
// Así el resto de la interfaz sigue leyendo `email`,
// `chatApariencia`, etc. sin abrir esas columnas a los demás.

function unirPerfilPrivado(
  publico: User,
  privado: UserPrivateData | null,
  emailDeAuth: string | null | undefined,
  baneado: boolean,
): User {
  const camposPrivados = privateFieldsOf(privado);
  const privacy: PrivacySettings = {
    ...DEFAULT_PRIVACY,
    ...(privado?.privacy ?? {}),
  };

  return {
    ...publico,
    ...camposPrivados,
    ...publicPrivacySignals(privacy),
    email: camposPrivados.email ?? emailDeAuth ?? '',
    isBanned: baneado,
    createdAt: toIsoString(publico.createdAt),
  };
}

/**
 * Crea las dos mitades del perfil en un lote atómico.
 *
 * Si se creara solo `users/{uid}` y fallara la privada, el usuario
 * existiría sin correo ni ajustes. Si se creara solo la privada y
 * fallara la pública, no podría usar la comunidad. El lote evita
 * los dos estados a medias.
 */
async function crearPerfilEnFirestore(
  uid: string,
  perfil: User,
  email: string,
): Promise<void> {
  const lote = writeBatch(db);
  const publico = soloCamposPublicos(perfil);

  lote.set(doc(db, 'users', uid), {
    ...publico,
    privateProfile: false,
    activityHidden: false,
    createdAt: serverTimestamp(),
  });

  lote.set(userPrivateRef(uid), {
    email,
    privacy: { ...DEFAULT_PRIVACY },
    updatedAt: serverTimestamp(),
  });

  await lote.commit();
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

  // Última versión del documento privado. Se guarda en un ref para
  // que el listener del perfil público pueda mezclarla sin volver a
  // suscribirse ni depender del orden en que lleguen los snapshots.
  const datosPrivadosRef = useRef<UserPrivateData | null>(null);
  const directorioUidRef = useRef<string | null>(null);
  const restriccionRef = useRef<{
    uid: string;
    promesa: Promise<EstadoRestriccion>;
  } | null>(null);

  const restriccionDe = (uid: string): Promise<EstadoRestriccion> => {
    if (restriccionRef.current?.uid === uid) return restriccionRef.current.promesa;
    const promesa = estadoRestriccion(uid);
    restriccionRef.current = { uid, promesa };
    return promesa;
  };

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
    const uid = currentUser?.uid ?? null;
    const anterior = directorioUidRef.current;
    if (anterior && anterior !== uid) clearUserCache(anterior);
    directorioUidRef.current = uid;

    if (!uid) {
      clearPrivateCaches();
      setUsersList([]);
      return;
    }

    let activo = true;
    const scope = userCacheScope(uid);
    const cargar = (force = false) => {
      void cachedRead({
        key: 'auth:users',
        scope,
        ttlMs: 5 * 60 * 1000,
        force,
        read: async () => {
          const snapshot = await measureRead(
            { name: 'directory', collection: 'users', origin: 'AuthContext' },
            (result) => result.size,
            () => getDocs(collection(db, 'users')),
          );

          return snapshot.docs
            .map((userDoc) => {
              const data = userDoc.data() as User & { isBanned?: boolean };
              const publico = soloCamposPublicos(data) as unknown as User;
              return {
                ...publico,
                privateProfile:
                  data.privateProfile === true || data.profileVisibility === 'private',
                activityHidden:
                  data.activityHidden === true || data.showActivity === false,
                createdAt: toIsoString(data.createdAt),
              };
            })
            .sort((a, b) => a.username.localeCompare(b.username));
        },
      })
        .then((directory) => {
          if (activo) setUsersList(directory);
        })
        .catch((error: Error) => {
          console.error('[Auth] No se pudo cargar el directorio de usuarios:', error);
          if (activo) setUsersList([]);
        });
    };

    const alInvalidar = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string; scope?: string }>).detail;
      if (detail?.key === 'auth:users' && detail.scope === scope) cargar(true);
    };
    window.addEventListener('geekapoo:cache-invalidated', alInvalidar);
    cargar();

    return () => {
      activo = false;
      window.removeEventListener('geekapoo:cache-invalidated', alInvalidar);
    };
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
          datosPrivadosRef.current = null;
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
          datosPrivadosRef.current = null;
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', fbUser.uid);

        pararDoc = onSnapshot(
          userDocRef,
          async (userDoc) => {

            if (userDoc.exists()) {

              const firestoreUser = userDoc.data() as User;

              // El registro duradero manda desde que existe. La
              // bandera antigua solo se usa si aún no hay registro,
              // para no reactivar un baneo ya levantado.
              const restriccion = await restriccionDe(fbUser.uid);
              const baneado = estaBaneado(firestoreUser, restriccion);

              setCurrentUser(
                unirPerfilPrivado(
                  firestoreUser,
                  datosPrivadosRef.current,
                  fbUser.email,
                  baneado,
                ),
              );

            } else {

              const username =
                fbUser.displayName
                  ?.replace(/\s+/g, '_')
                  .trim() ||
                fbUser.email?.split('@')[0] ||
                'UserGeek';

              // El perfil se acaba de borrar (o es la primera
              // vez). Antes de recrearlo se mira el registro
              // duradero: si hay un baneo vigente, el perfil nace
              // con el estado local de baneado. Las reglas lo
              // aplican igualmente aunque el documento no lleve
              // ninguna bandera.
              const restriccion = await restriccionDe(fbUser.uid);
              const baneado = restriccion.vigente;

              const newUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                username,
                displayName: fbUser.displayName || username,
                chatId: `GK-${Math.floor(1000 + Math.random() * 9000)}-${username.substring(0, 4).toUpperCase()}`,
                avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                role: 'user',
                createdAt: new Date().toISOString(),
                lastSeen: 'En línea',
                bio: 'Comunidad geekapoo.es',
                privateProfile: false,
                activityHidden: false,
              };

              const privadoInicial: UserPrivateData = {
                email: fbUser.email || '',
                privacy: { ...DEFAULT_PRIVACY },
              };
              datosPrivadosRef.current = privadoInicial;

              // Al escribir, este mismo listener salta de nuevo y
              // pone el documento ya creado. No se espera aquí.
              crearPerfilEnFirestore(
                fbUser.uid,
                newUser,
                fbUser.email || '',
              ).catch((e) =>
                console.error('Error al crear el perfil de Firestore:', e),
              );

              setCurrentUser(
                unirPerfilPrivado(
                  newUser,
                  privadoInicial,
                  fbUser.email,
                  baneado,
                ),
              );
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
  // ESCUCHAR LA RESTRICCIÓN DURADERA PROPIA
  // ====================================================
  //
  // Un baneo o desbaneo ya NO escribe la bandera del perfil
  // público: solo toca `accountRestrictions/{uid}`. Sin esta
  // escucha, el usuario seguiría viendo el estado anterior hasta
  // recargar o hasta que otro campo del perfil cambiara.
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) return;

    return onSnapshot(
      doc(db, 'accountRestrictions', uid),
      (snap) => {
        const existe = snap.exists();
        const data = snap.data() as { activo?: boolean; tipo?: string } | undefined;
        const vigente = existe && data?.activo === true && data?.tipo === 'ban';

        setCurrentUser((previo) => {
          if (!previo || previo.uid !== uid) return previo;
          // Si algún día se borra el registro, no se inventa un
          // estado: se conserva el último conocido.
          if (!existe) return previo;
          return { ...previo, isBanned: vigente };
        });
      },
      (error) => {
        console.error('[Auth] No se pudo escuchar la restricción de la cuenta:', error);
      },
    );
  }, [currentUser?.uid]);

  // ====================================================
  // ESCUCHAR LOS DATOS PRIVADOS PROPIOS
  // ====================================================
  //
  // El documento público y el privado son dos escuchas distintas:
  // el directorio de usuarios solo puede leer el primero y así
  // nunca recibe correos ni preferencias ajenas. Esta escucha solo
  // se abre para el uid de la sesión.
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      datosPrivadosRef.current = null;
      return;
    }

    return subscribeUserPrivate(
      uid,
      (privado) => {
        datosPrivadosRef.current = privado;

        setCurrentUser((previo) => {
          if (!previo || previo.uid !== uid) return previo;

          if (!privado) {
            // Cuenta sin migrar: todavía no existe `userPrivate`.
            // Se conservan los valores del perfil antiguo para no
            // romper la apariencia, la región ni la privacidad
            // mientras se ejecuta la migración. La migración los
            // copia y los borra del documento público; a partir de
            // ahí manda siempre el documento privado.
            const privacidadPrevia = readPrivacy(previo);
            return {
              ...previo,
              email: previo.email ?? auth.currentUser?.email ?? '',
              ...publicPrivacySignals(privacidadPrevia),
            };
          }

          return unirPerfilPrivado(
            previo,
            privado,
            previo.email ?? auth.currentUser?.email,
            previo.isBanned === true,
          );
        });
      },
      (error) => {
        console.error('[Auth] No se pudo leer el perfil privado:', error);
      },
    );
  }, [currentUser?.uid]);


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

      // El listener de `onAuthStateChanged` ya carga el perfil
      // público, el privado y la restricción. No se repiten aquí las
      // mismas tres lecturas mientras se resuelve la sesión.

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
        createdAt: new Date().toISOString(),
        lastSeen: 'En línea',
        bio: 'Nuevo miembro en geekapoo.es',
        privateProfile: false,
        activityHidden: false,
      };

      await crearPerfilEnFirestore(
        fbUser.uid,
        newUser,
        email.trim(),
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

      if (currentUser?.uid) {
        await marcarPresencia(currentUser.uid, false).catch(() => undefined);
      }
      await signOut(auth);
      clearPrivateCaches();
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

    const uid = currentUser.uid;
    const privado: Partial<UserPrivateData> = {};
    const publico: Record<string, unknown> = {};

    const camposPrivados = new Set<string>(PRIVATE_PROFILE_FIELDS);

    Object.entries(data).forEach(([campo, valor]) => {
      if (valor === undefined) return;

      if (camposPrivados.has(campo)) {
        // `profileVisibility`, `allowChatRequests` y `showActivity`
        // van dentro del mapa `privacy`; el resto, sueltos.
        if (
          campo !== 'profileVisibility' &&
          campo !== 'allowChatRequests' &&
          campo !== 'showActivity'
        ) {
          (privado as Record<string, unknown>)[campo] = valor;
        }
        return;
      }

      // El baneo nunca lo escribe el cliente: lo aplica la callable
      // y lo guarda `accountRestrictions`.
      if (campo === 'isBanned') return;

      publico[campo] = valor;
    });

    const tocaPrivacidad =
      data.profileVisibility !== undefined ||
      data.allowChatRequests !== undefined ||
      data.showActivity !== undefined;

    let privacidad: PrivacySettings | null = null;

    if (tocaPrivacidad) {
      privacidad = {
        ...readPrivacy(currentUser),
        ...(data.profileVisibility !== undefined
          ? { profileVisibility: data.profileVisibility }
          : {}),
        ...(data.allowChatRequests !== undefined
          ? { allowChatRequests: data.allowChatRequests }
          : {}),
        ...(data.showActivity !== undefined
          ? { showActivity: data.showActivity }
          : {}),
      };

      privado.privacy = privacidad;

      // Las dos únicas señales que el resto de la web necesita para
      // decidir si enseña el perfil y la actividad. No son los
      // ajustes completos: `allowChatRequests` se queda privado y
      // lo comprueban las reglas.
      const señales = publicPrivacySignals(privacidad);
      publico.privateProfile = señales.privateProfile;
      publico.activityHidden = señales.activityHidden;
    }

    const hayPrivado = Object.keys(privado).length > 0;
    const hayPublico = Object.keys(publico).length > 0;

    if (!hayPrivado && !hayPublico) return;

    const lote = writeBatch(db);

    if (hayPrivado) {
      lote.set(
        userPrivateRef(uid),
        {
          ...privado,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (hayPublico) {
      lote.set(doc(db, 'users', uid), publico, { merge: true });
    }

    await lote.commit();

    const siguientesPrivados: UserPrivateData = {
      ...(datosPrivadosRef.current ?? {}),
      ...privado,
      ...(privacidad ? { privacy: privacidad } : {}),
    };
    datosPrivadosRef.current = siguientesPrivados;

    const updatedUser: User = {
      ...currentUser,
      ...data,
      ...privateFieldsOf(siguientesPrivados),
      ...(privacidad ? publicPrivacySignals(privacidad) : {}),
      isBanned: currentUser.isBanned,
    };

    setCurrentUser(updatedUser);

    // El directorio ya está en memoria: se parchea la entrada propia
    // en vez de volver a descargar todos los usuarios.
    if (hayPublico) {
      const publico = soloCamposPublicos(updatedUser) as unknown as User;
      const siguiente = usersList
        .map((user) => (user.uid === uid ? { ...user, ...publico } : user))
        .sort((a, b) => a.username.localeCompare(b.username));
      setUsersList(siguiente);
      setCached('auth:users', siguiente, 5 * 60 * 1000, userCacheScope(uid));
    }
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