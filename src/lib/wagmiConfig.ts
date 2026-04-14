import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "MicroLeague Presale Admin",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [baseSepolia],
  transports: {
    // [mainnet.id]: http(),
    // [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
});

export const supportedChains = [baseSepolia];
