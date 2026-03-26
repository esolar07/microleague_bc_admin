import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider } from "wagmi";
import App from "./App.tsx";
import "./index.css";
import { wagmiConfig } from "./lib/wagmiConfig.ts";

const dynamicEnvironmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;

const queryClient = new QueryClient();

const cssOverrides = `
  .button--padding-small  {
    padding: .9rem 1rem !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    height: 51px !important;
  }
  /* Default title change */
  .modal-header__content h1[data-testid="dynamic-auth-modal-heading"] {
    font-size: 0 !important;
      font-weight: 600 !important;
  }
   .modal-header__content h1[data-testid="dynamic-auth-modal-heading"]::after {
    font-size: 5rem !important;
    font-weight: 600 !important;
    display: block !important;
    font-family: var(--font-display), sans-serif !important;
  }
    .dynamic-widget-inline-controls {
   background-color: white !important;
   border-radius: 50px !important;
}
    .dynamic-widget-inline-controls {
    height: 51px;
    max-height: none;
}
    .dynamic-widget-inline-controls__network-picker-main
    {
    margin-top:5px
    }
  `;

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    {dynamicEnvironmentId ? (
      <DynamicContextProvider
        settings={{
          environmentId: dynamicEnvironmentId,
          walletConnectors: [EthereumWalletConnectors],
          cssOverrides: cssOverrides,
          events: {
            onLogout: () => {
              localStorage.removeItem("dynamic_authentication_token");
              localStorage.removeItem("dynamic_authentication_token_v0");
              localStorage.removeItem("dynamic_user_authenticated");
              sessionStorage.removeItem("dynamic_authentication_token");
              queryClient.clear();

              setTimeout(() => {
                window.location.href = "/";
              }, 100);
            },
            onAuthSuccess: (args) => {
              console.log("Authentication successful", args);
            },
            onAuthFailure: (error) => {
              console.error("Authentication failed", error);
            },
          },
          initialAuthenticationMode: "connect-and-sign",
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <DynamicWagmiConnector>
            <App />
          </DynamicWagmiConnector>
        </WagmiProvider>
      </DynamicContextProvider>
    ) : (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <h1 className="text-3xl font-bold mb-4">Missing Environment Setup</h1>
          <p className="text-white/80 leading-7 mb-4">
            The app cannot start because <code>VITE_DYNAMIC_ENVIRONMENT_ID</code>{" "}
            is not defined.
          </p>
          <p className="text-white/70 leading-7 mb-4">
            Create a <code>.env.local</code> file in the project root and add:
          </p>
          <pre className="rounded-2xl bg-black/40 p-4 text-sm overflow-x-auto">
            <code>VITE_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id</code>
          </pre>
          <p className="text-white/60 text-sm mt-4">
            After saving the file, restart the frontend server.
          </p>
        </div>
      </div>
    )}
  </QueryClientProvider>
);
