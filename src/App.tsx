import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Transactions from "./pages/Transactions";
import AdminStages from "./pages/AdminStages";
import AdminBuyers from "./pages/AdminBuyers";
import AdminSettings from "./pages/AdminSettings";
import AdminVerifications from "./pages/AdminVerifications";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { AdminProvider } from "./context/AdminContext";
import AdminReputation from "./pages/AdminReputation";

const App = () => (
  <AdminProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/dashboard/tokens" element={<Tokens />} />
        <Route path="/dashboard/referrals" element={<Referrals />} />
        <Route path="/dashboard/transactions" element={<Transactions />} />
        <Route path="/dashboard/bank-transfer" element={<BankTransfer />} />
        <Route path="/dashboard/settings" element={<UserSettings />} /> */}

          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Navigate to="/presale" replace />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale/stages"
            element={
              <ProtectedAdminRoute>
                <AdminStages />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale/buyers"
            element={
              <ProtectedAdminRoute>
                <AdminBuyers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale/reputation"
            element={
              <ProtectedAdminRoute>
                <AdminReputation />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale/transactions"
            element={
              <ProtectedAdminRoute>
                <Transactions />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale/verifications"
            element={
              <ProtectedAdminRoute>
                <AdminVerifications />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/presale/settings"
            element={
              <ProtectedAdminRoute>
                <AdminSettings />
              </ProtectedAdminRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AdminProvider>
);

export default App;
