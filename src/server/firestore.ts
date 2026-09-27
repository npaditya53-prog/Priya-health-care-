import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, runTransaction, setDoc, deleteDoc, getDoc, Firestore } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';

let dbInstance: Firestore | null = null;

export function getBackendFirestore(): Firestore | null {
  if (dbInstance) return dbInstance;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const app = !getApps().length ? initializeApp(config) : getApp();
      dbInstance = getFirestore(app, config.firestoreDatabaseId);
    }
  } catch (err) {
    console.warn('[Firestore] Failed to initialize backend Firestore:', err);
  }
  return dbInstance;
}

/**
 * Reset counters/appointments or date-specific counters in Firestore to a specified number (defaults to 0).
 */
export async function resetFirestoreAppointmentCounter(newNumber: number = 0, date?: string) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docId = date ? `appointments_${date}` : 'appointments';
    const counterRef = doc(db, 'counters', docId);
    await runTransaction(db, async (txn) => {
      txn.set(
        counterRef,
        {
          lastAppointmentNumber: newNumber,
          date: date || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
  } catch (err) {
    console.warn('[Firestore] Counter reset notice:', err);
  }
}

/**
 * Ensure counters document is initialized in Firestore with highest known number for a date
 */
export async function initFirestoreCounterIfMissing(highestExisting: number, date?: string) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docId = date ? `appointments_${date}` : 'appointments';
    const counterRef = doc(db, 'counters', docId);
    await runTransaction(db, async (txn) => {
      const snap = await txn.get(counterRef);
      if (!snap.exists()) {
        txn.set(counterRef, {
          lastAppointmentNumber: highestExisting,
          date: date || null,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const val = snap.data()?.lastAppointmentNumber;
        if (typeof val !== 'number' || isNaN(val) || val < highestExisting) {
          txn.set(counterRef, {
            lastAppointmentNumber: highestExisting,
            date: date || null,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
    });
  } catch (err) {
    console.warn('[Firestore] Counter init notice:', err);
  }
}

/**
 * Atomically generates the next sequential appointment number FOR THE SPECIFIC APPOINTMENT DATE
 * and creates the appointment document in Firestore.
 * Concurrently safe: runTransaction ensures no two bookings for the same date receive the same appointment number.
 */
export async function createAppointmentInFirestoreAtomic(appointment: {
  id: string;
  appointment_id: string;
  patient_name: string;
  phone: string;
  email?: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  message?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}, currentDateMax: number): Promise<number> {
  const db = getBackendFirestore();
  const dateStr = appointment.appointment_date;
  const counterDocId = `appointments_${dateStr}`;

  if (db) {
    try {
      const counterRef = doc(db, 'counters', counterDocId);
      const aptDocRef = doc(db, 'appointments', appointment.appointment_id);

      const assignedNumber = await runTransaction(db, async (txn) => {
        const snap = await txn.get(counterRef);
        let last = 0;
        if (snap.exists()) {
          const val = snap.data()?.lastAppointmentNumber;
          if (typeof val === 'number' && !isNaN(val)) {
            last = val;
          }
        }
        if (currentDateMax > last) {
          last = currentDateMax;
        }
        const next = last + 1;

        // Atomically update per-date counter
        txn.set(
          counterRef,
          {
            lastAppointmentNumber: next,
            date: dateStr,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Atomically create appointment doc with assigned appointmentNumber
        txn.set(aptDocRef, {
          id: appointment.id,
          appointmentId: appointment.appointment_id,
          appointmentNumber: next,
          patientName: appointment.patient_name,
          phone: appointment.phone,
          email: appointment.email || '',
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          reason: appointment.reason,
          message: appointment.message || '',
          status: appointment.status,
          notes: appointment.notes || '',
          createdAt: appointment.created_at,
          updatedAt: appointment.updated_at,
        });

        return next;
      });

      return assignedNumber;
    } catch (err) {
      console.error('[Firestore] Atomic appointment transaction notice, using fallback sync:', err);
    }
  }

  // Fallback if Firestore transaction is unavailable: allocate local sequential number for the date
  const next = currentDateMax + 1;
  syncAppointmentDocumentToFirestore({
    ...appointment,
    appointment_number: next,
  }).catch(() => {});
  return next;
}

/**
 * Sync appointment document permanently to Firestore with dedicated appointmentNumber field.
 */
export async function syncAppointmentDocumentToFirestore(data: {
  id: string;
  appointment_id: string;
  appointment_number: number;
  patient_name: string;
  phone: string;
  email?: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  message?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, 'appointments', data.appointment_id);
    await setDoc(docRef, {
      id: data.id,
      appointmentId: data.appointment_id,
      appointmentNumber: data.appointment_number,
      patientName: data.patient_name,
      phone: data.phone,
      email: data.email || '',
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      reason: data.reason,
      message: data.message || '',
      status: data.status,
      notes: data.notes || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Appointment doc sync notice:', err);
  }
}

/**
 * Delete appointment document from Firestore
 */
export async function deleteAppointmentFromFirestore(appointmentId: string) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Appointment doc delete notice:', err);
  }
}

/**
 * Sync clinic contact and location document to Firestore /clinic/clinic-singahi-main
 */
export async function syncClinicDocumentToFirestore(data: {
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
  const db = getBackendFirestore();
  if (!db) return;
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
  } catch (err) {
    console.warn('[Firestore] Clinic doc sync notice:', err);
  }
}

/**
 * Sync contact message/inquiry to Firestore /contact_messages/{id}
 */
export async function syncContactMessageToFirestore(data: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, 'contact_messages', data.id);
    await setDoc(
      docRef,
      {
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        message: data.message,
        status: data.status,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Contact message sync notice:', err);
  }
}

/**
 * Delete contact message from Firestore
 */
export async function deleteContactMessageFromFirestore(id: string) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, 'contact_messages', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Contact message delete notice:', err);
  }
}

/**
 * Sync Dr. Gultun Paswan profile document to Firestore /doctor/doctor-gultun-paswan
 */
export async function syncDoctorDocumentToFirestore(data: {
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
}) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const docRef = doc(db, 'doctor', 'doctor-gultun-paswan');
    const isPublishedBool =
      data.is_published !== undefined && data.is_published !== null
        ? typeof data.is_published === 'boolean'
          ? data.is_published
          : Number(data.is_published) !== 0
        : true;

    await setDoc(
      docRef,
      {
        id: 'doctor-gultun-paswan',
        name: data.name || 'Dr. Gultun Paswan',
        designation: data.designation || 'Lead Consulting Physician',
        bio: data.bio || '',
        qualifications: data.qualifications || '',
        experience: data.experience || '',
        specialties: data.specialties || '',
        registration: data.registration || '',
        consultation_info: data.consultation_info || '',
        is_published: isPublishedBool,
        image_url: data.image_url || '',
        phone: data.phone || '',
        email: data.email || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('[Firestore] Synced doctor profile doc doctor-gultun-paswan');
  } catch (err) {
    console.warn('[Firestore] Doctor doc sync notice:', err);
  }
}

/**
 * Fetch Dr. Gultun Paswan profile from Firestore
 */
export async function getDoctorFromFirestore() {
  const db = getBackendFirestore();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'doctor', 'doctor-gultun-paswan'));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('[Firestore] Doctor fetch notice:', err);
  }
  return null;
}


