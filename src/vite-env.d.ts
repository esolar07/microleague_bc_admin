/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DYNAMIC_ENVIRONMENT_ID?: string;
  readonly VITE_TOKEN_PRESALE_ADDRESS?: string;
  readonly VITE_USDT_ADDRESS?: string;
  readonly VITE_USDC_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
