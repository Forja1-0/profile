/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_FORJA_MODE?: "amateur" | "elite";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
