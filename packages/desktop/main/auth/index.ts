// Auth tokens are currently managed by the Supabase SDK inside the renderer
// (stored in localStorage via its built-in persistence layer).
//
// If tokens ever need to be held securely in the main process, use:
//   import { safeStorage } from 'electron'
//   safeStorage.encryptString(token)   → Buffer
//   safeStorage.decryptString(buffer)  → string
//
// TODO: implement when renderer-to-main token delegation is required.
export {}
