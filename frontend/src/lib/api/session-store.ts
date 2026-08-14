/**
 * What this app keeps on the device.
 *
 * Two strings: the bearer token and which profile was last chosen. Everything
 * else — profiles, mastery, progress — now lives behind the API, so a lost or
 * cleared browser loses a sign-in, not a child's progress.
 *
 * Nothing here is a child's data. The token is a grown-up's credential and the
 * profile id is an opaque server id.
 */

const TOKEN_KEY = "atlas-kids.token.v1";
const LAST_PROFILE_KEY = "atlas-kids.lastProfile.v1";
/** Written by the pre-API build. Removed on sight; it held children's data. */
const LEGACY_PROFILES_KEY = "atlas-kids.profiles.v1";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null; // Private mode or blocked storage: the app still works, signed out.
  }
}

function read(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    const store = storage();
    if (!store) return;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* storage full or blocked — the session still works in memory */
  }
}

export const loadToken = () => read(TOKEN_KEY);
export const saveToken = (token: string | null) => write(TOKEN_KEY, token);

export const loadLastProfileId = () => read(LAST_PROFILE_KEY);
export const saveLastProfileId = (id: string | null) => write(LAST_PROFILE_KEY, id);

/** Drops the profiles the localStorage-first build left behind. */
export function clearLegacyProfiles() {
  if (read(LEGACY_PROFILES_KEY) !== null) write(LEGACY_PROFILES_KEY, null);
}

export function signOutLocally() {
  saveToken(null);
  saveLastProfileId(null);
}
