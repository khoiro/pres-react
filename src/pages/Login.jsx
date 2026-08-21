import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();

  const { login, isAuthenticated } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nip: "",
    password: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await api.post("/login", form);

      login(response.data.data);

      Swal.fire({
        icon: "success",
        title: "Login Berhasil",
        showConfirmButton: false,
        timer: 1200,
      });

      navigate("/dashboard");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center vh-100">
        <div className="col-md-4">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="text-center mb-4">PRESENSI</h3>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">NIP</label>

                  <input
                    type="text"
                    className="form-control"
                    name="nip"
                    value={form.nip}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Password</label>

                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Loading..." : "LOGIN"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
