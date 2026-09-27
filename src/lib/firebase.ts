import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { isAuthorizedAdminEmail } from '../config/adminConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initial application boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

// Sync Appointment to Firestore
export async function syncAppointmentToFirestore(data: {
  appointmentId: string;
  appointmentNumber?: number;
  patientName: string;
  phone: string;
  email?: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  message?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}) {
  const path = `appointments/${data.appointmentId}`;
  try {
    const docRef = doc(db, 'appointments', data.appointmentId);
    await setDoc(docRef, {
      ...data,
      email: data.email || '',
      message: data.message || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Firestore appointment sync notice:', error);
  }
}

// Sync Contact Message to Firestore
export async function syncContactMessageToFirestore(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}) {
  const messageId = 'msg_' + Date.now();
  const path = `contact_messages/${messageId}`;
  try {
    const docRef = doc(db, 'contact_messages', messageId);
    await setDoc(docRef, {
      ...data,
      email: data.email || '',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Firestore contact message sync notice:', error);
  }
}

// Sync authenticated Google user profile to Firestore
export async function syncUserProfileToFirestore(fbUser: User) {
  if (!fbUser || !fbUser.uid) return;
  const path = `users/${fbUser.uid}`;
  try {
    const isGrantedAdmin = isAuthorizedAdminEmail(fbUser.email);
    const effectiveRole = isGrantedAdmin ? 'ADMIN' : 'PATIENT';

    const docRef = doc(db, 'users', fbUser.uid);
    await setDoc(
      docRef,
      {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        photoURL: fbUser.photoURL || '',
        role: effectiveRole,
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (isGrantedAdmin) {
      try {
        const adminDocRef = doc(db, 'admins', fbUser.uid);
        await setDoc(
          adminDocRef,
          {
            uid: fbUser.uid,
            email: fbUser.email || '',
            role: 'ADMIN',
            grantedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (admErr) {
        console.warn('Admins collection sync notice:', admErr);
      }
    }
  } catch (error) {
    console.warn('Firestore user profile sync notice:', error);
  }
}

// Sync Clinic Contact and Location to Firestore
export async function syncClinicToFirestore(data: {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  opening_hours?: string;
  google_maps_url?: string | null;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}) {
  const path = 'clinic/clinic-singahi-main';
  try {
    const docRef = doc(db, 'clinic', 'clinic-singahi-main');
    await setDoc(
      docRef,
      {
        name: data.name || 'Priya Health Care',
        city: data.city || 'Singahi',
        address: data.address || '',
        state: data.state || 'Uttar Pradesh',
        pincode: data.pincode || '',
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        email: data.email,
        opening_hours: data.opening_hours || 'Monday to Saturday: 09:00 AM - 07:00 PM',
        google_maps_url: data.google_maps_url || '',
        phoneVerified: data.phoneVerified ?? true,
        emailVerified: data.emailVerified ?? true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore clinic sync notice:', error);
  }
}

// Fetch Clinic from Firestore if needed
export async function getClinicFromFirestore() {
  try {
    const snap = await getDoc(doc(db, 'clinic', 'clinic-singahi-main'));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Firestore clinic fetch notice:', error);
  }
  return null;
}

export interface DoctorRealtimeData {
  id?: string;
  name: string;
  designation: string;
  bio?: string;
  qualifications?: string;
  experience?: string;
  specialties?: string;
  registration?: string;
  consultation_info?: string;
  is_published?: boolean | number;
  image_url?: string;
  phone?: string;
  email?: string;
  updatedAt?: string;
  fromCache?: boolean;
}

// Real-time subscription to canonical Doctor Profile /doctor/doctor-gultun-paswan
export function subscribeToDoctor(
  onData: (data: DoctorRealtimeData | null, fromCache: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, 'doctor', 'doctor-gultun-paswan');
  return onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      const fromCache = snapshot.metadata.fromCache;
      if (snapshot.exists()) {
        const raw = snapshot.data();
        onData(
          {
            ...raw,
            fromCache,
          } as DoctorRealtimeData,
          fromCache
        );
      } else {
        onData(null, fromCache);
      }
    },
    (err) => {
      console.warn('[Firestore Realtime] Doctor listener notice:', err);
      if (onError) onError(err);
    }
  );
}

// Sync Doctor Profile to Firestore
export async function syncDoctorToFirestore(data: {
  name: string;
  designation: string;
  bio?: string | null;
  qualifications?: string | null;
  experience?: string | null;
  specialties?: string | null;
  registration?: string | null;
  consultation_info?: string | null;
  is_published?: number | boolean | null;
  image_url?: string | null;
  phone?: string | null;
  email?: string | null;
}): Promise<void> {
  const path = 'doctor/doctor-gultun-paswan';
  const docRef = doc(db, 'doctor', 'doctor-gultun-paswan');

  let existingDoc: any = null;
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      existingDoc = snap.data();
    }
  } catch {
    // ignore
  }

  const isPlaceholder = (val: any) =>
    !val ||
    val === '[ADD VERIFIED INFORMATION]' ||
    String(val).toLowerCase().includes('pending verification');

  const pickBest = (incomingVal: any, existingVal: any, fallback: string = '') => {
    if (incomingVal !== undefined && incomingVal !== null && !isPlaceholder(incomingVal)) {
      return String(incomingVal).trim();
    }
    if (existingVal !== undefined && existingVal !== null && !isPlaceholder(existingVal)) {
      return String(existingVal).trim();
    }
    return incomingVal !== undefined && incomingVal !== null ? String(incomingVal).trim() : fallback;
  };

  const isPublishedBool =
    data.is_published !== undefined && data.is_published !== null
      ? typeof data.is_published === 'boolean'
        ? data.is_published
        : Number(data.is_published) !== 0
      : true;

  const payload: Record<string, any> = {
    id: 'doctor-gultun-paswan',
    name: pickBest(data.name, existingDoc?.name, 'Dr. Gultun Paswan'),
    designation: pickBest(data.designation, existingDoc?.designation, 'Lead Consulting Physician'),
    bio: pickBest(data.bio, existingDoc?.bio, ''),
    qualifications: pickBest(data.qualifications, existingDoc?.qualifications, ''),
    experience: pickBest(data.experience, existingDoc?.experience, ''),
    specialties: pickBest(data.specialties, existingDoc?.specialties, ''),
    registration: pickBest(data.registration, existingDoc?.registration, ''),
    consultation_info: pickBest(data.consultation_info, existingDoc?.consultation_info, ''),
    is_published: isPublishedBool,
    image_url: pickBest(data.image_url, existingDoc?.image_url, ''),
    phone: pickBest(data.phone, existingDoc?.phone, ''),
    email: pickBest(data.email, existingDoc?.email, ''),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    try {
      localStorage.setItem('priya_cached_doctor', JSON.stringify(payload));
    } catch {
      // ignore
    }
    console.log('[Firestore] Doctor doc synced successfully to doctor/doctor-gultun-paswan');
  } catch (error) {
    console.error('Firestore doctor sync failed:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch Doctor Profile from Firestore
export async function getDoctorFromFirestore() {
  try {
    const snap = await getDoc(doc(db, 'doctor', 'doctor-gultun-paswan'));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Firestore doctor fetch notice:', error);
  }
  return null;
}



