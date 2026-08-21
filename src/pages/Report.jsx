import { useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";

import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export default function Report() {
  const { user } = useContext(AuthContext);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!user?.nip) return;

    setLoading(true);

    try {
      const response = await api.get("/recap", {
        params: {
          nip: user.nip,
          month,
          year,
        },
      });

      setData(response.data.data || []);
      setMeta(response.data.meta || null);
    } catch (err) {
      setData([]);
      setMeta(null);

      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text:
          err.response?.data?.message ||
          "Terjadi kesalahan saat mengambil rekap presensi.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Muat data pertama kali begitu data user (nip) tersedia
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    const d = new Date(dateStr);

    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const statusBadge = (status, isLate) => {
    if (!status) {
      return <span className="badge bg-secondary">Belum Ada</span>;
    }

    const color = isLate ? "bg-danger" : "bg-success";

    return <span className={`badge ${color}`}>{status}</span>;
  };

  return (
    <div className="card card-custom">
      <div className="card-body">
        <h3>Report Presensi</h3>

        <hr />

        <form
          className="row g-3 align-items-end mb-4"
          onSubmit={handleFilter}
        >
          <div className="col-auto">
            <label className="form-label">Bulan</label>

            <select
              className="form-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <label className="form-label">Tahun</label>

            <select
              className="form-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="col-auto">
            <button className="btn btn-primary" disabled={loading}>
              <i className="bi bi-search me-2"></i>
              {loading ? "Memuat..." : "Tampilkan"}
            </button>
          </div>

          {meta && (
            <div className="col-auto ms-auto">
              <span className="text-muted">
                Total data: <strong>{meta.total}</strong>
              </span>
            </div>
          )}
        </form>

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Tanggal</th>
                <th>Jam Masuk</th>
                <th>Status Masuk</th>
                <th>Jam Keluar</th>
                <th>Status Keluar</th>
                <th>Keterangan</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Tidak ada data presensi pada periode ini.
                  </td>
                </tr>
              )}

              {!loading &&
                data.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.date)}</td>

                    <td>{item.checkin || "-"}</td>

                    <td>
                      {statusBadge(item.checkin_status, item.is_checkin_late)}
                    </td>

                    <td>{item.checkout || "-"}</td>

                    <td>
                      {statusBadge(
                        item.checkout_status,
                        item.is_checkout_late,
                      )}
                    </td>

                    <td>{item.keterangan || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
