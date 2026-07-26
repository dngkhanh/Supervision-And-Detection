import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Navbar from '../../components/Navbar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ activeJobs: 0, expiredJobs: 0, waitingJobs: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/job/admin/stats");
      if (res.data && res.data.success) {
        setStats(res.data.data);
      } else {
        throw new Error("Lấy số liệu thất bại");
      }
    } catch (err) {
      console.error("Lỗi fetch dashboard stats:", err);
      setError("Không thể tải dữ liệu, vui lòng thử lại sau");
      setStats({ activeJobs: 0, expiredJobs: 0, waitingJobs: 0 });

      const status = err.response?.status;
      if (status === 401 || status === 403) {
        localStorage.clear();
        navigate('/login');
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
      navigate('/login');
      return;
    }

    fetchStats();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Theo dõi toàn diện và tổng quan trạng thái các bài đăng tuyển dụng trên hệ thống</p>
              </div>
              <button 
                onClick={fetchStats}
                className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 w-fit"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                </svg>
                Làm mới
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Active Jobs */}
              <div 
                onClick={() => navigate('/admin/jobs?status=active')}
                className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[180px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Công việc còn hạn</span>
                    <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-gray-900 mt-4">
                    {loading ? '--' : stats.activeJobs.toLocaleString()}
                  </h2>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-4 hover:underline">Xem chi tiết bài đăng còn hạn →</p>
              </div>

              {/* Card 2: Expired Jobs */}
              <div 
                onClick={() => navigate('/admin/jobs?status=expired')}
                className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[180px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Công việc hết hạn</span>
                    <span className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-gray-900 mt-4">
                    {loading ? '--' : stats.expiredJobs.toLocaleString()}
                  </h2>
                </div>
                <p className="text-xs text-rose-600 font-semibold mt-4 hover:underline">Xem chi tiết bài đăng hết hạn →</p>
              </div>

              {/* Card 3: Waiting Jobs */}
              <div 
                onClick={() => navigate('/admin/jobs?status=waiting')}
                className="bg-white p-8 rounded-3xl border border-amber-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[180px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">Bài đăng chờ duyệt</span>
                    <span className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-gray-900 mt-4">
                    {loading ? '--' : stats.waitingJobs.toLocaleString()}
                  </h2>
                </div>
                <p className="text-xs text-amber-600 font-semibold mt-4 hover:underline">Xem chi tiết bài đăng chờ duyệt →</p>
              </div>
            </div>

            {/* Quick Actions / Navigation panel */}
            <div className="mt-12 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Lối tắt quản trị</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button 
                  onClick={() => navigate('/admin/jobs')}
                  className="flex items-center justify-between p-5 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 transition-all text-left group"
                >
                  <div>
                    <h4 className="font-bold text-blue-900">Quản lý bài viết</h4>
                    <p className="text-xs text-blue-700/70 mt-1">Duyệt bài đăng mới, quản lý bài đăng đang hoạt động và hết hạn</p>
                  </div>
                  <span className="p-2 bg-blue-100 text-blue-700 rounded-xl group-hover:translate-x-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/admin/members')}
                  className="flex items-center justify-between p-5 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 transition-all text-left group"
                >
                  <div>
                    <h4 className="font-bold text-indigo-900">Quản lý thành viên</h4>
                    <p className="text-xs text-indigo-700/70 mt-1">Giám sát số lượng người dùng và ứng viên hệ thống</p>
                  </div>
                  <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl group-hover:translate-x-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;