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
      <div className="flex items-center justify-center min-h-screen bg-[#050a1a]">
        <div className="animate-spin h-20 w-20 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050a1a] flex items-center justify-center">
      {/* Large logo as background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <img
          src="/assets/images/logo.webp"
          alt=""
          className="w-[700px] max-w-[90vw] opacity-10"
          aria-hidden="true"
        />
      </div>

      {/* Blue-to-black radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(220_100%_30%_/_0.45)_0%,_#050a1a_70%)]" />

      {/* Bottom dark fade */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#050a1a] to-transparent" />

      <section className="relative z-10 w-full px-6 py-24">
        <div className="container mx-auto flex justify-center">
          <div className="max-w-[480px] w-full text-center p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_60px_rgba(0,102,255,0.15)]">
            {/* Logo inside card */}
            <div className="flex justify-center mb-6">
              <img
                src="/assets/images/logo.webp"
                alt="MicroLeague Coin"
                className="h-14 w-auto"
              />
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg">
              Microleague Coin
              <span className="block text-2xl font-semibold mt-1 text-primary/80">
                Admin Dashboard
              </span>
            </h1>

            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-10">
              Manage MLC presale stages, buyers, verifications, and token
              operations from one place.
            </p>

            <div className="flex justify-center">
              <DynamicWidget
                innerButtonComponent={
                  <button className="px-8 py-3 text-base font-semibold rounded-full bg-primary text-white transition-all hover:bg-primary/90 shadow-[0_0_20px_hsl(220_100%_50%_/_0.4)] hover:shadow-[0_0_30px_hsl(220_100%_50%_/_0.6)]">
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
