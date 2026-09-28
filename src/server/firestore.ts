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
  photo_base64?: string | null;
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

    // Fetch existing doc first to prevent overwriting real user data with empty/placeholder values
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
      val === undefined ||
      val === null ||
      val === '[ADD VERIFIED INFORMATION]' ||
      String(val).toLowerCase().includes('pending verification');

    const cleanField = (incomingVal: any, existingVal: any, fallback: string = '') => {
      // 1. If incoming value is explicitly provided and not a placeholder, use it (even if empty string)
      if (incomingVal !== undefined && incomingVal !== null && incomingVal !== '[ADD VERIFIED INFORMATION]') {
        return String(incomingVal).trim();
      }
      // 2. If incoming is omitted or placeholder, use existing real value if available
      if (existingVal !== undefined && existingVal !== null && !isPlaceholder(existingVal)) {
        return String(existingVal).trim();
      }
      return fallback;
    };

    const photoVal = cleanField(data.image_url, existingDoc?.image_url, '');

    const payload = {
      id: 'doctor-gultun-paswan',
      name: cleanField(data.name, existingDoc?.name, 'Dr. Gultun Paswan'),
      designation: cleanField(data.designation, existingDoc?.designation, 'Lead Consulting Physician'),
      bio: cleanField(data.bio, existingDoc?.bio, ''),
      qualifications: cleanField(data.qualifications, existingDoc?.qualifications, ''),
      experience: cleanField(data.experience, existingDoc?.experience, ''),
      specialties: cleanField(data.specialties, existingDoc?.specialties, ''),
      registration: cleanField(data.registration, existingDoc?.registration, ''),
      consultation_info: cleanField(data.consultation_info, existingDoc?.consultation_info, ''),
      is_published: isPublishedBool,
      image_url: photoVal,
      photo_base64: photoVal,
      phone: cleanField(data.phone, existingDoc?.phone, ''),
      email: cleanField(data.email, existingDoc?.email, ''),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, payload, { merge: true });
    console.log('[Firestore] Synced doctor profile doc doctor-gultun-paswan successfully');
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

/**
 * Hydrates local SQLite database from Firestore on startup.
 * Firestore is the CANONICAL single source of truth across website restarts and deployments.
 */
export async function hydrateDoctorFromFirestore(sqliteDb: any) {
  const db = getBackendFirestore();
  if (!db) return;
  try {
    const snap = await getDoc(doc(db, 'doctor', 'doctor-gultun-paswan'));
    if (snap.exists()) {
      const fsData = snap.data();
      const isPlaceholder = (val: any) =>
        !val ||
        val === '[ADD VERIFIED INFORMATION]' ||
        String(val).toLowerCase().includes('pending verification');

      // If Firestore contains non-placeholder qualifications or details, hydrate SQLite!
      const current = sqliteDb.prepare('SELECT * FROM doctor WHERE id = ?').get('doctor-gultun-paswan') as any;
      const now = new Date().toISOString();

      const name = !isPlaceholder(fsData.name) ? String(fsData.name).trim() : (current?.name || 'Dr. Gultun Paswan');
      const designation = !isPlaceholder(fsData.designation) ? String(fsData.designation).trim() : (current?.designation || 'Lead Consulting Physician');
      const bio = !isPlaceholder(fsData.bio) ? String(fsData.bio).trim() : (current && !isPlaceholder(current.bio) ? current.bio : '');
      const qualifications = !isPlaceholder(fsData.qualifications) ? String(fsData.qualifications).trim() : (current && !isPlaceholder(current.qualifications) ? current.qualifications : '');
      const experience = !isPlaceholder(fsData.experience) ? String(fsData.experience).trim() : (current && !isPlaceholder(current.experience) ? current.experience : '');
      const specialties = !isPlaceholder(fsData.specialties) ? String(fsData.specialties).trim() : (current && !isPlaceholder(current.specialties) ? current.specialties : '');
      const registration = !isPlaceholder(fsData.registration) ? String(fsData.registration).trim() : (current && !isPlaceholder(current.registration) ? current.registration : '');
      const consultation_info = !isPlaceholder(fsData.consultation_info) ? String(fsData.consultation_info).trim() : (current && !isPlaceholder(current.consultation_info) ? current.consultation_info : '');
      const is_published = fsData.is_published !== undefined ? (fsData.is_published ? 1 : 0) : (current?.is_published ?? 1);
      const image_url = !isPlaceholder(fsData.image_url) ? String(fsData.image_url).trim() : (current?.image_url || '');
      const phone = !isPlaceholder(fsData.phone) ? String(fsData.phone).trim() : (current?.phone || '');
      const email = !isPlaceholder(fsData.email) ? String(fsData.email).trim() : (current?.email || '');

      if (!current) {
        sqliteDb.prepare(`
          INSERT INTO doctor (id, name, designation, bio, qualifications, experience, specialties, registration, consultation_info, is_published, image_url, phone, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'doctor-gultun-paswan', name, designation, bio, qualifications, experience, specialties,
          registration, consultation_info, is_published, image_url, phone, email, now, now
        );
      } else {
        sqliteDb.prepare(`
          UPDATE doctor SET
            name = ?, designation = ?, bio = ?, qualifications = ?, experience = ?,
            specialties = ?, registration = ?, consultation_info = ?, is_published = ?,
            image_url = ?, phone = ?, email = ?, updated_at = ?
          WHERE id = ?
        `).run(
          name, designation, bio, qualifications, experience, specialties,
          registration, consultation_info, is_published, image_url, phone, email, now,
          'doctor-gultun-paswan'
        );
      }
      console.log('[Firestore] SQLite hydrated successfully from persistent Firestore doctor document');
    }
  } catch (err) {
    console.warn('[Firestore] Notice during doctor startup hydration:', err);
  }
}


