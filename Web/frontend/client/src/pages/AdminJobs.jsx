import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";

const LIMIT = 10;

const AdminJobs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ activeJobs: 0, expiredJobs: 0, waitingJobs: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobsCount, setTotalJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read status from URL query param: statusFilter will update automatically when query changes
  const statusFilter = searchParams.get("status") || "";

  // Modal state for Refusal / Takedown
  const [refuseModal, setRefuseModal] = useState({ show: false, jobId: null, jobTitle: "", reason: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: LIMIT
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await axiosClient.get("/job/job/admin/jobs", { params });

      if (res.data && res.data.success) {
        setJobs(res.data.data || []);
        setStats(res.data.stats || { activeJobs: 0, expiredJobs: 0, waitingJobs: 0 });
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalJobsCount(res.data.pagination?.totalJobs || 0);
      } else {
        throw new Error("Lấy danh sách bài đăng thất bại");
      }
    } catch (err) {
      console.error("Fetch admin jobs error:", err);
      setError(err.response?.data?.message || err.message || "Đã xảy ra lỗi khi tải dữ liệu");

      // EX-11.2 Hết hạn phiên đăng nhập
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const roleId = Number(localStorage.getItem("role_id"));

    if (!token || roleId !== 1) {
      localStorage.clear();
      navigate("/login");
      return;
    }

    fetchJobs();
  }, [navigate, page, statusFilter]);

  const handleFilterChange = (filter) => {
    if (filter) {
      setSearchParams({ status: filter });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const goPrev = () => setPage((p) => Math.max(p - 1, 1));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages));

  // Approve action
  const handleApprove = async (jobId) => {
    try {
      setActionLoading(true);
      const res = await axiosClient.post("/job/job/accept", { job_id: jobId });
      showToast(res.data?.message || "Duyệt bài đăng thành công!", "success");
      fetchJobs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Duyệt bài đăng thất bại", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject / Takedown action
  const handleRefuseClick = (job) => {
    setRefuseModal({
      show: true,
      jobId: job.job_id,
      jobTitle: job.job_title,
      reason: ""
    });
    setActionError("");
  };

  const handleRefuseSubmit = async (e) => {
    e.preventDefault();
    if (!refuseModal.reason.trim()) {
      setActionError("Vui lòng nhập lý do từ chối hoặc gỡ bài");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");
      const res = await axiosClient.post("/job/job/refuse", {
        job_id: refuseModal.jobId,
        reason: refuseModal.reason
      });
      setRefuseModal({ show: false, jobId: null, jobTitle: "", reason: "" });
      showToast(res.data?.message || "Từ chối/Gỡ bài thành công!", "success");
      fetchJobs();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || err.message || "Từ chối/Gỡ bài thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabelAndStyle = (job) => {
    const today = new Date();
    const isExpired = job.status === "expired" || job.status === "outdated" || (job.status === "available" && new Date(job.closed_date) < today);

    if (job.status === "waiting") {
      return {
        label: "Chờ duyệt",
        style: "bg-amber-50 text-amber-700 border border-amber-200"
      };
    } else if (isExpired) {
      return {
        label: "Đã hết hạn",
        style: "bg-red-50 text-red-700 border border-red-200"
      };
    } else {
      return {
        label: "Còn hạn đăng",
        style: "bg-green-50 text-green-700 border border-green-200"
      };
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col relative">
      <Navbar />

      <div className="flex flex-1">
        {/* LEFT SIDEBAR (LIKE FB) */}
        <div className="w-64 border-r bg-white sticky top-[64px] h-[calc(100vh-64px)] p-6 hidden md:block shrink-0">
          <div className="space-y-2">
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === "/admin/dashboard"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/admin/jobs"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === "/admin/jobs"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Quản lý bài viết
            </Link>

            <Link
              to="/admin/members"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${location.pathname === "/admin/members"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Quản lý thành viên
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Quản lý bài viết</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Kiểm duyệt bài đăng tuyển dụng mới, quản lý bài viết đang hiển thị và các tin đăng đã hết hạn
                </p>
              </div>
              <button
                onClick={fetchJobs}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 w-fit"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                </svg>
                Làm mới
              </button>
            </div>

            {/* ERROR STATE */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* STATS BLOCKS (UPGRADED) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Card 1: Active Jobs */}
              <div
                onClick={() => handleFilterChange("active")}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "active" ? 'ring-2 ring-emerald-500 border-emerald-100' : 'border-gray-100'}`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Công việc còn hạn</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                    {loading ? "--" : stats.activeJobs.toLocaleString()}
                  </h2>
                  <p className="text-xs text-emerald-600 mt-2 hover:underline font-semibold">Lọc xem danh sách</p>
                </div>
                <span className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>

              {/* Card 2: Waiting Jobs */}
              <div
                onClick={() => handleFilterChange("waiting")}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "waiting" ? 'ring-2 ring-amber-500 border-amber-100' : 'border-gray-100'}`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bài đăng chờ duyệt</span>
                  <h2 className="text-3xl font-extrabold text-amber-600 mt-2">
                    {loading ? "--" : stats.waitingJobs.toLocaleString()}
                  </h2>
                  <p className="text-xs text-amber-600 mt-2 hover:underline font-semibold font-bold">Lọc xem danh sách</p>
                </div>
                <span className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
              </div>

              {/* Card 3: Expired Jobs */}
              <div
                onClick={() => handleFilterChange("expired")}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "expired" ? 'ring-2 ring-red-500 border-red-100' : 'border-gray-100'}`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Công việc hết hạn</span>
                  <h2 className="text-3xl font-extrabold text-red-600 mt-2">
                    {loading ? "--" : stats.expiredJobs.toLocaleString()}
                  </h2>
                  <p className="text-xs text-red-600 mt-2 hover:underline font-semibold">Lọc xem danh sách</p>
                </div>
                <span className="p-4 bg-red-50 text-red-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* TABLE LIST CONTAINER */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-2 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">Danh sách bài đăng</h3>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => handleFilterChange("")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => handleFilterChange("waiting")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "waiting" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Chờ duyệt
                  </button>
                  <button
                    onClick={() => handleFilterChange("active")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "active" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Còn hạn
                  </button>
                  <button
                    onClick={() => handleFilterChange("expired")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "expired" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Hết hạn
                  </button>
                </div>
              </div>

              {loading && (
                <div className="p-12 text-center text-gray-500 font-medium">Đang tải dữ liệu...</div>
              )}

              {!loading && jobs.length === 0 && (
                <div className="p-12 text-center text-gray-500 font-medium flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Không tìm thấy bài viết tuyển dụng nào.</span>
                </div>
              )}

              {!loading && jobs.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-600 font-semibold whitespace-nowrap">
                        <th className="px-6 py-4">STT</th>
                        <th className="px-6 py-4">Tiêu đề công việc</th>
                        <th className="px-6 py-4">Tên công ty</th>
                        <th className="px-6 py-4">Khu vực</th>
                        <th className="px-6 py-4">Ngày hết hạn</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 whitespace-nowrap">
                      {jobs.map((job, index) => {
                        const stt = (page - 1) * LIMIT + index + 1;
                        const { label, style } = getStatusLabelAndStyle(job);
                        const isWaiting = job.status === "waiting";
                        const closedDateStr = job.closed_date ? new Date(job.closed_date).toLocaleDateString("vi-VN") : "Chưa cập nhật";
                        return (
                          <tr key={job._id || job.job_id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{stt}</td>
                            <td className="px-6 py-4 font-semibold text-blue-600 max-w-[200px] truncate" title={job.job_title}>
                              {job.job_title}
                            </td>
                            <td className="px-6 py-4 font-medium max-w-[150px] truncate" title={job.company_name}>
                              {job.company_name}
                            </td>
                            <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate" title={job.province || "Toàn quốc"}>
                              {job.province || "Toàn quốc"}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{closedDateStr}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${style}`}>
                                {label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  to={`/job/${job.job_id}`}
                                  className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                >
                                  Xem
                                </Link>

                                {isWaiting ? (
                                  <>
                                    <button
                                      onClick={() => handleApprove(job.job_id)}
                                      disabled={actionLoading}
                                      className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => handleRefuseClick(job)}
                                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleRefuseClick(job)}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                  >
                                    Gỡ bài
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* PAGINATION */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="text-xs text-gray-500 font-medium">
                      Hiển thị từ {(page - 1) * LIMIT + 1} đến {Math.min(page * LIMIT, totalJobsCount)} trong tổng số {totalJobsCount} tin tuyển dụng
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={goPrev}
                        disabled={page === 1}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        ← Trang trước
                      </button>

                      <span className="text-xs text-gray-600 font-bold px-3">
                        Trang {page} / {totalPages}
                      </span>

                      <button
                        onClick={goNext}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Trang sau →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REFUSE / TAKEDOWN REASON MODAL */}
      {refuseModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900">Từ chối / Gỡ bài viết</h3>
            <p className="text-sm text-gray-500 mt-2">
              Bạn đang thực hiện gỡ bỏ bài đăng <strong className="text-gray-900">"{refuseModal.jobTitle}"</strong>. Vui lòng nhập lý do (thông báo này sẽ được gửi tới nhà tuyển dụng).
            </p>

            {actionError && (
              <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">{actionError}</p>
            )}

            <form onSubmit={handleRefuseSubmit} className="mt-4 space-y-4">
              <textarea
                placeholder="Ví dụ: Nội dung chứa thông tin sai lệch, lương ảo, lừa đảo..."
                value={refuseModal.reason}
                onChange={(e) => setRefuseModal({ ...refuseModal, reason: e.target.value })}
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500 h-28 resize-none text-sm"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRefuseModal({ show: false, jobId: null, jobTitle: "", reason: "" })}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5"
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Xác nhận gỡ bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-6 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 font-semibold text-sm ${toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
            }`}>
            {toast.type === "success" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
