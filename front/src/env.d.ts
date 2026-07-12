/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_42_CLIENT_ID: string
  readonly VITE_42_REDIRECT_URI: string
  readonly VITE_42_SCOPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.glb?url' {
  const src: string
  export default src
}

declare module '*.gltf?url' {
  const src: string
  export default src
}

declare module '*.png?url' {
  const src: string
  export default src
}

declare module '*.jpg?url' {
  const src: string
  export default src
}

declare module '*.jpeg?url' {
  const src: string
  export default src
}

declare module '*.webp?url' {
  const src: string
  export default src
}
