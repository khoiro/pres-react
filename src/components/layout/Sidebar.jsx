import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { LayoutContext } from "../../context/LayoutContext";

export default function Sidebar() {
  const navigate = useNavigate();

  const { logout } = useContext(AuthContext);
  const { sidebarOpen, closeSidebar } = useContext(LayoutContext);

  const handleLogout = () => {
    logout();
    closeSidebar();

    navigate("/");
  };

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="logo">PRESENSI</div>

        <div className="sidebar-menu">
          <NavLink to="/dashboard" onClick={closeSidebar}>
            <i className="bi bi-speedometer2 me-3"></i>
            Dashboard
          </NavLink>

          <NavLink to="/checkin" onClick={closeSidebar}>
            <i className="bi bi-box-arrow-in-right me-3"></i>
            Checkin
          </NavLink>

          <NavLink to="/checkout" onClick={closeSidebar}>
            <i className="bi bi-box-arrow-right me-3"></i>
            Checkout
          </NavLink>

          <NavLink to="/report" onClick={closeSidebar}>
            <i className="bi bi-file-earmark-text me-3"></i>
            Report
          </NavLink>

          <NavLink to="/profile" onClick={closeSidebar}>
            <i className="bi bi-person-circle me-3"></i>
            Profile
          </NavLink>

          <hr className="text-white" />

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();

              handleLogout();
            }}
          >
            <i className="bi bi-box-arrow-right me-3"></i>
            Logout
          </a>
        </div>
      </div>
    </>
  );
}
