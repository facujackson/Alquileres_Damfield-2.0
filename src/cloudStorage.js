import { createClient } from '@supabase/supabase-js';

const STORAGE_PREFIX = 'damfield-alquileres:';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getLocalValue(key) {
  const storage = getStorage();
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
  const storage = getStorage();
  const prefixedKey = `${STORAGE_PREFIX}${key}`;

  try {
    if (storage) {
      if (value === null || value === undefined) {
        storage.removeItem(prefixedKey);
      } else {
        storage.setItem(prefixedKey, String(value));
      }
      return;
    }
  } catch {}
}

async function getRemoteValue(key) {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient
      .from('app_data')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn('Supabase read failed:', error.message);
      return null;
    }

    return data ? { value: data.value } : null;
  } catch (error) {
    console.warn('Supabase read failed:', error);
    return null;
  }
}

async function setRemoteValue(key, value) {
  if (!supabaseClient) return false;

  try {
    const { error } = await supabaseClient.from('app_data').upsert(
      { key, value: String(value), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

    if (error) {
      console.warn('Supabase write failed:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Supabase write failed:', error);
    return false;
  }
}

export function installCloudStorage() {
  window.storage = {
    get: async (key) => {
      const remoteValue = await getRemoteValue(key);
      if (remoteValue) return remoteValue;
      return getLocalValue(key);
    },
    set: async (key, value) => {
      const remoteOk = await setRemoteValue(key, value);
      if (!remoteOk) {
        setLocalValue(key, value);
        return;
      }
      setLocalValue(key, value);
    },
  };
}
