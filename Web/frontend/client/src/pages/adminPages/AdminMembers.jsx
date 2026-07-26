import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import Navbar from "../../components/Navbar";

const LIMIT = 10;

const AdminMembers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0 });
  const [statusFilter, setStatusFilter] = useState(""); // "" (All), "Active", "Banned"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [banModal, setBanModal] = useState({ show: false, userId: null, username: "", reason: "" });
  const [unbanModal, setUnbanModal] = useState({ show: false, userId: null, username: "" });
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, username: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        page,
        limit: LIMIT,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await axiosClient.get("/user/admin/users", { params });

      if (res.data && res.data.success) {
        setUsers(res.data.data || []);
        setStats(res.data.stats || { totalUsers: 0, activeUsers: 0, bannedUsers: 0 });
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        throw new Error("Lấy dữ liệu người dùng thất bại");
      }
    } catch (err) {
      console.error("Fetch admin users error:", err);
      setError("Hệ thống bận, vui lòng thử lại sau");
      
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

    fetchUsers();
  }, [navigate, page, statusFilter]);

  // Reset page when filter changes
  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const goPrev = () => setPage((p) => Math.max(p - 1, 1));
  const goNext = () => setPage((p) => Math.min(p + 1, totalPages));

  // Action handlers
  const handleBanClick = (user) => {
    setBanModal({ show: true, userId: user.user_id, username: user.username, reason: "" });
    setActionError("");
  };

  const handleBanSubmit = async (e) => {
    e.preventDefault();
    if (!banModal.reason.trim()) {
      setActionError("Vui lòng nhập lý do khóa tài khoản");
      return;
    }
    try {
      setActionLoading(true);
      setActionError("");
      const res = await axiosClient.put(`/user/admin/users/${banModal.userId}/ban`, {
        reason: banModal.reason,
      });
      if (res.data && res.data.success) {
        setBanModal({ show: false, userId: null, username: "", reason: "" });
        fetchUsers();
      } else {
        throw new Error(res.data?.message || "Khóa tài khoản thất bại");
      }
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || err.message || "Khóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanClick = (user) => {
    setUnbanModal({ show: true, userId: user.user_id, username: user.username });
    setActionError("");
  };

  const handleUnbanConfirm = async () => {
    try {
      setActionLoading(true);
      setActionError("");
      const res = await axiosClient.put(`/user/admin/users/${unbanModal.userId}/unban`);
      if (res.data && res.data.success) {
        setUnbanModal({ show: false, userId: null, username: "" });
        fetchUsers();
      } else {
        throw new Error(res.data?.message || "Mở khóa thất bại");
      }
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || err.message || "Mở khóa thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteModal({ show: true, userId: user.user_id, username: user.username });
    setActionError("");
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      setActionError("");
      const res = await axiosClient.delete(`/user/admin/users/${deleteModal.userId}`);
      if (res.data && res.data.success) {
        setDeleteModal({ show: false, userId: null, username: "" });
        fetchUsers();
      } else {
        throw new Error(res.data?.message || "Xóa tài khoản thất bại");
      }
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || err.message || "Xóa thất bại");
    } finally {
      setActionLoading(false);
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === "/admin/dashboard"
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === "/admin/jobs"
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === "/admin/members"
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
                <h1 className="text-3xl font-extrabold text-gray-900">Quản lý thành viên</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Thống kê tổng quy mô và danh sách chi tiết các tài khoản hoạt động trên toàn hệ thống
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 w-fit"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                </svg>
                Làm mới
              </button>
            </div>

            {/* ERROR MESSAGE (EX-12.1) */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* STATS BLOCKS (UC-12 Upgraded with active and banned stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Card 1: Total Users */}
              <div 
                onClick={() => handleFilterChange("")}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "" ? 'ring-2 ring-blue-500 border-blue-100' : 'border-gray-100'}`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng thành viên</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                    {loading ? "--" : stats.totalUsers.toLocaleString()}
                  </h2>
                  <p className="text-xs text-blue-600 mt-2 hover:underline font-semibold">Xem tất cả</p>
                </div>
                <span className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>

              {/* Card 2: Active Users */}
              <div 
                onClick={() => handleFilterChange("Active")}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "Active" ? 'ring-2 ring-emerald-500 border-emerald-100' : 'border-gray-100'}`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đang hoạt động</span>
                  <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                    {loading ? "--" : stats.activeUsers.toLocaleString()}
                  </h2>
                  <p className="text-xs text-emerald-600 mt-2 hover:underline font-semibold">Xem danh sách</p>
                </div>
                <span className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>

              {/* Card 3: Banned Users (Click to filter banned list!) */}
              <div 
                onClick={() => handleFilterChange("Banned")}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "Banned" ? 'ring-2 ring-red-500 border-red-100' : 'border-gray-100'}`}
              >
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tài khoản đã khóa</span>
                  <h2 className="text-3xl font-extrabold text-red-600 mt-2">
                    {loading ? "--" : stats.bannedUsers.toLocaleString()}
                  </h2>
                  <p className="text-xs text-red-600 mt-2 hover:underline font-semibold font-bold">Xem tài khoản bị khóa</p>
                </div>
                <span className="p-4 bg-red-50 text-red-600 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* LIST TABLE CONTAINER */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Tab Navigation Filter Header */}
              <div className="px-6 pt-6 pb-2 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">Danh sách thành viên</h3>
                
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => handleFilterChange("")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => handleFilterChange("Active")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "Active" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Đang hoạt động
                  </button>
                  <button
                    onClick={() => handleFilterChange("Banned")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === "Banned" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Đã khóa
                  </button>
                </div>
              </div>

              {loading && (
                <div className="p-12 text-center text-gray-500 font-medium">Đang tải dữ liệu...</div>
              )}

              {!loading && users.length === 0 && (
                <div className="p-12 text-center text-gray-500 font-medium flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Không tìm thấy thành viên nào phù hợp bộ lọc này.</span>
                </div>
              )}

              {!loading && users.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-600 font-semibold whitespace-nowrap">
                        <th className="px-6 py-4">STT</th>
                        <th className="px-6 py-4">Tên đăng nhập</th>
                        <th className="px-6 py-4">Họ và Tên</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Vai trò</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4 text-center">Số lần ứng tuyển</th>
                        <th className="px-6 py-4 text-center">Số lần đăng bài</th>
                        <th className="px-6 py-4 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 whitespace-nowrap">
                      {users.map((u, index) => {
                        const stt = (page - 1) * LIMIT + index + 1;
                        const isSelf = u.username === localStorage.getItem("username") || u.role_id === 1; // Can't ban/delete self or other admins
                        return (
                          <tr key={u._id || u.user_id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{stt}</td>
                            <td className="px-6 py-4 font-semibold text-blue-600">
                              <span 
                                onClick={() => navigate(`/profile/${u.username}`)}
                                className="hover:underline cursor-pointer"
                              >
                                {u.username}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium">{u.full_name || "--"}</td>
                            <td className="px-6 py-4">{u.email || "--"}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${
                                  u.role_id === 1
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {u.role_id === 1 ? "Quản trị viên" : "Ứng viên / Nhà tuyển dụng"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${
                                  u.status === "Banned"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-green-50 text-green-700 border border-green-200"
                                }`}
                              >
                                {u.status === "Banned" ? "Đã khóa" : "Hoạt động"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-900">
                              {u.applied_job || 0}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-900">
                              {u.posted_job || 0}
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              {isSelf ? (
                                <span className="text-gray-400 text-xs italic">Không cho phép</span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  {u.status === "Banned" ? (
                                    <button
                                      onClick={() => handleUnbanClick(u)}
                                      className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                    >
                                      Mở khóa
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBanClick(u)}
                                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                    >
                                      Khóa
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteClick(u)}
                                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* PAGINATION CONTROLS */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="text-xs text-gray-500 font-medium">
                      Hiển thị từ {(page - 1) * LIMIT + 1} đến {Math.min(page * LIMIT, stats.totalUsers)} trong tổng số {stats.totalUsers} thành viên
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

      {/* BAN MODAL */}
      {banModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900">Khóa tài khoản: {banModal.username}</h3>
            <p className="text-sm text-gray-500 mt-2">Vui lòng nhập lý do khóa tài khoản này. Người dùng sẽ thấy lý do này khi đăng nhập.</p>
            
            {actionError && (
              <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">{actionError}</p>
            )}

            <form onSubmit={handleBanSubmit} className="mt-4 space-y-4">
              <textarea
                placeholder="Ví dụ: Spam tin tuyển dụng lừa đảo, vi phạm điều khoản..."
                value={banModal.reason}
                onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-amber-500 h-28 resize-none text-sm"
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBanModal({ show: false, userId: null, username: "", reason: "" })}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5"
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Xác nhận khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNBAN CONFIRM MODAL */}
      {unbanModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900">Mở khóa tài khoản</h3>
            <p className="text-sm text-gray-500 mt-2">
              Bạn có chắc chắn muốn mở khóa cho tài khoản <strong className="text-gray-900">@{unbanModal.username}</strong>? Người dùng sẽ lấy lại quyền truy cập hệ thống ngay lập tức.
            </p>

            {actionError && (
              <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">{actionError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUnbanModal({ show: false, userId: null, username: "" })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleUnbanConfirm}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5"
                disabled={actionLoading}
              >
                {actionLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Xác nhận mở khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-600">⚠️ Cảnh báo xóa tài khoản</h3>
            <p className="text-sm text-gray-500 mt-2">
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa tài khoản <strong className="text-gray-900">@{deleteModal.username}</strong> khỏi hệ thống?
            </p>

            {actionError && (
              <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">{actionError}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, userId: null, username: "" })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5"
                disabled={actionLoading}
              >
                {actionLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembers;
