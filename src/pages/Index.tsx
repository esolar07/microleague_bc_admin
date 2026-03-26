import { useNavigate } from "react-router-dom";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
const Index = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAdmin();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black/90">
        <div className="animate-spin h-20 w-20 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen bg-background relative"
      style={{
        backgroundImage: `url('/assets/images/background.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        <div className="container mx-auto flex justify-center">
          <div className="max-w-[480px] w-full text-center p-10 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <h1 className="text-5xl md:text-5xl font-extrabold mb-6 text-white drop-shadow-lg">
              Microleague Coin (MLC)
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-10">
              Access the Microleague Coin presale dashboard and manage MLC
              stages, buyers, verifications, and token operations from one
              place.
            </p>
           <div className="flex justify-center">
             <DynamicWidget
              innerButtonComponent={
                <button className="px-8 py-3 text-lg font-semibold rounded-full border border-white/30 text-white transition-all hover:bg-white/10 hover:border-white/50 backdrop-blur-md">
                  Connect Wallet
                </button>
              }
            />
           </div>
            {isAuthenticated && !isAdmin && !isLoading && (
              <div className="mt-6 text-red-400 text-center font-medium">
                <p>This wallet is not authorized as an admin.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
export default Index;
