import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { LayoutContext } from "../../context/LayoutContext";

export default function Navbar() {
  const { user } = useContext(AuthContext);
  const { toggleSidebar } = useContext(LayoutContext);

  return (
    <div className="top-navbar px-3 px-md-4 d-flex justify-content-between align-items-center">
      <button
        type="button"
        className="btn btn-toggle-sidebar d-lg-none"
        onClick={toggleSidebar}
        aria-label="Buka menu"
      >
        <i className="bi bi-list"></i>
      </button>

      <div className="ms-auto d-flex align-items-center">
        {user && (
          <>
            <img
              src={user.picture}
              width="45"
              height="45"
              className="rounded-circle border"
            />

            <div className="ms-3 d-none d-sm-block">
              <div className="fw-bold">{user.name}</div>

              <small className="text-muted">{user.nip}</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
