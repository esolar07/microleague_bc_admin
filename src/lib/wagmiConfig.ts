import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

const isMainnet = import.meta.env.VITE_NETWORK === "base";
const activeChain = isMainnet ? base : baseSepolia;

export const wagmiConfig = getDefaultConfig({
  appName: "MicroLeague Coin Admin",
  appDescription:
    "Manage MicroLeague Coin presale stages, buyers, verifications, and token operations",
  appUrl: "https://microleague-bc-admin.vercel.app",
  appIcon: "https://microleague-bc-admin.vercel.app/assets/images/logo.webp",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [activeChain],
  transports: {
    [activeChain.id]: http(),
  },
  ssr: false,
});

export const supportedChains = [activeChain];
