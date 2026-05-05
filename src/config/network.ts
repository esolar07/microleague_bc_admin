import { base, baseSepolia } from "wagmi/chains";

export type NetworkKey = "base" | "baseSepolia";

const networkKey =
  (import.meta.env.VITE_NETWORK as NetworkKey | undefined) ?? "base";

export const APP_CHAIN = networkKey === "base" ? base : baseSepolia;

export const APP_CHAIN_ID = APP_CHAIN.id;

/** Block explorer base URL for the active chain */
export const EXPLORER_URL =
  APP_CHAIN.blockExplorers?.default?.url ?? "https://basescan.org";

/** Build a full explorer link for a transaction hash */
export function txExplorerUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}

/** Build a full explorer link for an address */
export function addressExplorerUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
