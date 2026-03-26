import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  userType: "user" | "admin";
}

export const DashboardLayout = ({
  children,
  userType,
}: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <Sidebar 
        userType={userType} 
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main content area with left margin for fixed sidebar */}
      <div className="sm:ml-64">
        <Header onMenuClick={toggleSidebar} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
