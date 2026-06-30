interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_42_CLIENT_ID: string
  readonly VITE_42_REDIRECT_URI: string
  readonly VITE_42_SCOPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
