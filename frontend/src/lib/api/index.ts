/**
 * The app's single API entry point.
 *
 * `api` reads the token from the device store on every request, so signing in
 * or out anywhere takes effect everywhere without threading a client through
 * the tree.
 */

import { createApiClient, DEFAULT_BASE_URL } from "./client";
import { loadToken } from "./session-store";

/** `VITE_API_BASE_URL` points the app at a backend on another origin. */
const baseUrl = import.meta.env?.["VITE_API_BASE_URL"] || DEFAULT_BASE_URL;

export const api = createApiClient({ baseUrl, getToken: loadToken });

export { ApiError, NetworkError, createApiClient, DEFAULT_BASE_URL } from "./client";
export type { ApiClient, Transport } from "./client";
export * from "./types";
export {
  clearLegacyProfiles,
  loadLastProfileId,
  loadToken,
  saveLastProfileId,
  saveToken,
  signOutLocally,
} from "./session-store";
