import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, child } from 'firebase/database';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const STORAGE_PREFIX = 'damfield-alquileres:';

async function getRemoteValue(key) {
  try {
    const snapshot = await get(child(ref(db), `${STORAGE_PREFIX}${key}`));
    if (snapshot.exists()) {
      return { value: snapshot.val() };
    }
    return null;
  } catch (error) {
    console.warn('Firebase read failed:', error.message);
    return null;
  }
}

async function setRemoteValue(key, value) {
  try {
    await set(ref(db, `${STORAGE_PREFIX}${key}`), String(value));
    return true;
  } catch (error) {
    console.warn('Firebase write failed:', error.message);
    return false;
  }
}

function getLocalValue(key) {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;
  const prefixedKey = `${STORAGE_PREFIX}${key}`;

  try {
    if (storage) {
      const raw = storage.getItem(prefixedKey);
      return raw === null ? null : { value: raw };
    }
  } catch {}

  return null;
}

function setLocalValue(key, value) {
  const storage = typeof window !== 'undefined' ? window.localStorage : null;
  const prefixedKey = `${STORAGE_PREFIX}${key}`;

  try {
    if (storage) {
      if (value === null || value === undefined) {
        storage.removeItem(prefixedKey);
      } else {
        storage.setItem(prefixedKey, String(value));
      }
    }
  } catch {}
}

export function installFirebaseStorage() {
  window.storage = {
    get: async (key) => {
      const remoteValue = await getRemoteValue(key);
      if (remoteValue) {
        setLocalValue(key, remoteValue.value);
        return remoteValue;
      }
      return getLocalValue(key);
    },
    set: async (key, value) => {
      setLocalValue(key, value);
      await setRemoteValue(key, value);
    },
  };
}
