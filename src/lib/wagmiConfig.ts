import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

// Use env-var RPC URLs so useWaitForTransactionReceipt can reliably detect
// confirmations. Default public endpoints are rate-limited and cause the hook
// to hang indefinitely even after a tx is confirmed on-chain.
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    // [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL),
    // [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});

export const supportedChains = [mainnet, sepolia];
