import { createContext, useState } from "react";

export const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
