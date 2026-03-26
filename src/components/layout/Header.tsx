import { formatWallet } from "@/lib/utils";
import { Person } from "../icons";
import { useAdmin } from "@/hooks/useAdmin";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { address } = useAdmin();
  return (
    <header className="bg-white border-b border-border">
      <div className="mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Menu button - only visible on mobile */}
        <button
          onClick={onMenuClick}
          className="sm:hidden hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        <div className="flex gap-3 max-h-[51px] items-center h-10 ml-auto">
          <div className="w-10 h-10 rounded-full bg-[#7529ED] flex justify-center items-center">
            <Person />
          </div>
          <div>
            <p className="text-xs font-normal">Admin</p>
            <div className="flex items-center gap-1">
              <p className="text-xs font-normal">{formatWallet(address)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
