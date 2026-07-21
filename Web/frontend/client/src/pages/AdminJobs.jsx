import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import JobCard from "../components/JobCard";
import Navbar from "../components/Navbar";

const LIMIT = 6;

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const roleId = Number(localStorage.getItem("role_id"));

    // ❌ Chưa đăng nhập
    if (!token) {
      navigate("/login");
      return;
    }

    // ❌ Không phải admin
    if (roleId !== 1) {
      navigate("/");
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axiosClient.get("/job/job/waiting", {
          params: {
            page,
            limit: LIMIT,
          },
        });

        const json = res.data;

        setJobs(json.data || []);
        setTotalPages(json.totalPages || 1);
      } catch (err) {
        console.error("Fetch waiting jobs error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Đã xảy ra lỗi khi tải dữ liệu"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [navigate, page]);

  const goPrev = () => setPage((p) => Math.max(p - 1, 1));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ===== NAVBAR (GIỐNG HOMEPAGE) ===== */}
      <Navbar />

      {/* ===== CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-10">
        <h1 className="text-2xl font-semibold mb-4">
          Quản trị việc làm – Chờ duyệt
        </h1>

        {loading && <div className="text-gray-600">Đang tải...</div>}

        {error && <div className="text-red-600">Lỗi: {error}</div>}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-gray-600">
            Không có công việc chờ duyệt.
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <div
              className="
                grid gap-6
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {jobs.map((job) => (
                <JobCard key={job._id || job.job_id} job={job} />
              ))}
            </div>

            {/* ===== PAGINATION ===== */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={goPrev}
                disabled={page === 1}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                ← Trang trước
              </button>

              <span className="font-medium">
                Trang {page} / {totalPages}
              </span>

              <button
                onClick={goNext}
                disabled={page === totalPages}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Trang sau →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminJobs;
