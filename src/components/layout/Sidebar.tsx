import { Home, Coins, Users, History, Settings, BarChart3, Shield, Building2, CheckCircle, X, UserCog } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

interface SidebarProps {
  userType: "user" | "admin";
  isOpen: boolean;
  onClose: () => void;
}

const userMenuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Coins, label: "My Tokens", path: "/dashboard/tokens" },
  { icon: Users, label: "Referrals", path: "/dashboard/referrals" },
  // { icon: History, label: "Transactions", path: "/dashboard/transactions" },
  { icon: Building2, label: "Bank Transfer", path: "/dashboard/bank-transfer" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const presaleMenuItems = [
  { icon: Home, label: "Overview", path: "/presale" },
  { icon: BarChart3, label: "Stages", path: "/presale/stages" },
  { icon: Users, label: "Buyers", path: "/presale/buyers" },
  { icon: History, label: "Transactions", path: "/presale/transactions" },
  { icon: CheckCircle, label: "Verifications", path: "/presale/verifications" },
  { icon: Building2, label: "Private Sale", path: "/presale/private-sale-submissions" },
  { icon: UserCog, label: "Admins", path: "/presale/admins" },
  { icon: Shield, label: "Settings", path: "/presale/settings" },
];

export const Sidebar = ({ userType, isOpen, onClose }: SidebarProps) => {
  const { clearAuthData, disconnect } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      clearAuthData();
      disconnect();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  };

  const isActiveLink = (path: string) => {
    if (path === "/dashboard" || path === "/presale") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0`}
    >
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <img src="/assets/images/logo.webp" alt="Microleague Coin MLC" className="w-28" />
        {/* Close button - only visible on mobile */}
        <button
          onClick={onClose}
          className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Scrollable Navigation - Takes remaining space */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {userType === "admin" ? (
          <>
            {/* Presale Section */}
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Presale
              </p>
              <ul className="space-y-1">
                {presaleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveLink(item.path);

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <ul className="space-y-1">
            {userMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
