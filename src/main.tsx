import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import App from "./App.tsx";
import "./index.css";
import { wagmiConfig } from "./lib/wagmiConfig.ts";

const queryClient = new QueryClient();

const appInfo = {
  appName: "MicroLeague Coin Admin",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
};

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        appInfo={{
          appName: appInfo.appName,
          learnMoreUrl: "https://microleague-bc-admin.vercel.app",
          disclaimer: ({ Text, Link }) => (
            <Text>
              By connecting your wallet, you agree to the{" "}
              <Link href="https://microleague-bc-admin.vercel.app">
                Terms of Service
              </Link>{" "}
              and acknowledge you have read and understand the protocol
              disclaimer.
            </Text>
          ),
        }}
        modalSize="compact"
        theme={darkTheme({
          accentColor: "hsl(220, 100%, 50%)",
          accentColorForeground: "white",
          borderRadius: "large",
        })}
      >
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>,
);
