import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="d-flex">
      <Sidebar />

      <div
        className="flex-grow-1"
        style={{
          minHeight: "100vh",
          background: "#f5f6fa",
        }}
      >
        <Navbar />

        <div className="p-3 p-md-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
