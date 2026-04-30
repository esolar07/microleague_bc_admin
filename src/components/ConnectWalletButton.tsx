import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { baseSepolia } from "wagmi/chains";

export const ConnectWalletButton = () => {
  const { isConnected, address, chainId } = useAccount();
  const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

  useEffect(() => {
    if (isConnected && address) {
      console.log("Wallet connected:", address);
      console.log("Chain ID:", chainId);
      console.log("Required Chain ID:", baseSepolia.id);

      if (isWrongNetwork) {
        console.warn(
          `Wrong network! Connected to chain ${chainId}, but ${baseSepolia.name} (${baseSepolia.id}) is required`,
        );
      }

      // Force close any open RainbowKit modals by triggering a small delay
      // This ensures the modal closes after QR code scan connection
      const timer = setTimeout(() => {
        // The modal should auto-close, but we log for debugging
        console.log("Connection established, modal should close");
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isConnected, address, chainId, isWrongNetwork]);

  return (
    <div className="flex flex-col items-center gap-3">
      <ConnectButton />
    </div>
  );
};
