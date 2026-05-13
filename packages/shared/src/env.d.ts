interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_ENVIRONMENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly url: string
}

declare module '*.css'
