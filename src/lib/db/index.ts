import type { DataStore } from "./store";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";

let store: DataStore | null = null;

/**
 * Returns the configured data store. Defaults to the zero-config local adapter
 * so the platform is fully functional without external credentials. Set
 * DATA_ADAPTER=supabase (plus Supabase env vars) for production persistence.
 */
export function getStore(): DataStore {
  if (store) return store;
  const adapter = (process.env.DATA_ADAPTER || "local").toLowerCase();
  store = adapter === "supabase" ? new SupabaseStore() : new LocalStore();
  return store;
}

export type { DataStore };
