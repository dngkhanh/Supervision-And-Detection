import { useEffect, useState, useRef } from "react";
import axiosClient from "../api/axiosClient";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();
  const loggedInUserId = localStorage.getItem("user_id");

  // Determine if viewing own profile (starts as true if no param or matches ID)
  const [isOwnProfile, setIsOwnProfile] = useState(!routeUserId || routeUserId === loggedInUserId);

  const [user, setUser] = useState({
    user_id: "",
    username: "",
    full_name: "",
    email: "",
    cv_path: "",
    role_id: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [postedJobs, setPostedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Custom details saved in localStorage. Avatar and Cover are kept default/fixed.
  const [profileDetails, setProfileDetails] = useState({
    bio: "",
    phone: "",
    location: "",
    website: "",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    bio: "",
    phone: "",
    location: "",
    website: ""
  });

  // 1. Fetch user profile from database
  const fetchUser = async () => {
    try {
      if (!routeUserId) {
        // Viewing own profile directly via /profile
        const res = await axiosClient.get("/user/user/me");
        if (res.data && res.data.user) {
          const u = res.data.user;
          setUser({
            ...u,
            status: u.status || "Active",
            ban_reason: u.ban_reason || ""
          });
          setIsOwnProfile(true);
          setEditForm({
            full_name: u.full_name || "",
            email: u.email || "",
            bio: "",
            phone: "",
            location: "",
            website: ""
          });
          loadCustomDetails(u.user_id);
          fetchPostedJobs(u.user_id, true);
        }
      } else {
        // Viewing via /profile/:param (param can be userId or username)
        const res = await axiosClient.get(`/user/user/info/${routeUserId}`);
        if (res.data && res.data.data) {
          const u = res.data.data;
          const own = String(u.user_id) === String(loggedInUserId);
          console.log("Profile DB fetch -> user:", u.username, "u.user_id:", u.user_id, "loggedInUserId:", loggedInUserId, "own evaluated:", own);
          setIsOwnProfile(own);
          setUser({
            user_id: u.user_id,
            username: u.username,
            full_name: u.full_name || "",
            email: u.email || "",
            role_id: u.role_id || "",
            status: u.status || "Active",
            ban_reason: u.ban_reason || ""
          });
          setEditForm({
            full_name: u.full_name || "",
            email: u.email || "",
            bio: "",
            phone: "",
            location: "",
            website: ""
          });
          loadCustomDetails(u.user_id);
          fetchPostedJobs(u.user_id, own);
        }
      }
    } catch (err) {
      console.error("Lỗi fetch user:", err);
    }
  };

  const loadCustomDetails = (targetId) => {
    if (!targetId) return;
    const saved = localStorage.getItem(`profile_details_${targetId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfileDetails(prev => ({
          ...prev,
          bio: parsed.bio || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          website: parsed.website || ""
        }));
        setEditForm(prev => ({
          ...prev,
          bio: parsed.bio || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          website: parsed.website || ""
        }));
      } catch (e) {
        console.error("Lỗi parse profile details:", e);
      }
    } else {
      const defaults = { bio: "", phone: "", location: "", website: "" };
      setProfileDetails(prev => ({ ...prev, ...defaults }));
      setEditForm(prev => ({ ...prev, ...defaults }));
    }
  };

  const fetchPostedJobs = async (targetId, own) => {
    console.log("fetchPostedJobs call -> targetId:", targetId, "own parameter received:", own);
    if (!targetId) return;
    setLoadingJobs(true);
    try {
      const url = own ? "/job/job/posted" : `/job/job/posted?userId=${targetId}`;
      const res = await axiosClient.get(url);
      const jobs = res.data?.data || [];
      
      // Filter: only show available/active jobs if not profile owner
      const filteredJobs = own 
        ? jobs 
        : jobs.filter(job => job.status === "available" || job.status === "active");

      // Fetch application count for each job (only for owner)
      const jobsWithCounts = await Promise.all(
        filteredJobs.map(async (job) => {
          if (!own) {
            return { ...job, appCount: 0 };
          }
          const jobId = job.job_id || job._id;
          try {
            const appRes = await axiosClient.get(`/application/application/applier-id/${jobId}`);
            return { ...job, appCount: appRes.data?.count || 0 };
          } catch (err) {
            console.error(`Lỗi fetch app count cho job ${jobId}:`, err);
            return { ...job, appCount: 0 };
          }
        })
      );
      
      setPostedJobs(jobsWithCounts);
    } catch (err) {
      console.error("Lỗi fetch posted jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [routeUserId]);

  // Save the custom profile details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Update full_name & email in DB
      await axiosClient.put("/user/user/profile", {
        full_name: editForm.full_name,
        email: editForm.email
      });

      // 2. Save custom details to localStorage
      const updatedDetails = {
        bio: editForm.bio,
        phone: editForm.phone,
        location: editForm.location,
        website: editForm.website
      };
      localStorage.setItem(`profile_details_${user.user_id}`, JSON.stringify(updatedDetails));
      setProfileDetails(prev => ({
        ...prev,
        ...updatedDetails
      }));

      setShowEditModal(false);
      await fetchUser();
      setMessage("✅ Đã cập nhật trang cá nhân thành công!");
    } catch (err) {
      console.error("Lỗi update profile:", err);
      setMessage("❌ Cập nhật trang cá nhân thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Job management
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Bạn có chắc chắn muốn tạm ẩn bài đăng tuyển dụng này không?")) return;
    try {
      await axiosClient.put(`/job/job/${jobId}/soft-delete`);
      await fetchPostedJobs();
      setMessage("✅ Đã tạm ẩn công việc thành công!");
    } catch (err) {
      console.error("Xóa công việc thất bại:", err);
      setMessage("❌ Xóa công việc thất bại.");
    }
  };

  const handleRestoreJob = async (jobId) => {
    try {
      await axiosClient.put(`/job/job/${jobId}/restore`);
      await fetchPostedJobs();
      setMessage("✅ Đã khôi phục công việc thành công!");
    } catch (err) {
      console.error("Khôi phục công việc thất bại:", err);
      setMessage("❌ Khôi phục công việc thất bại.");
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Đăng vài ngày trước";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "Đăng hôm nay";
    if (diffDays === 2) return "Đăng hôm qua";
    return `Đăng ${diffDays} ngày trước`;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <Navbar />

      {/* Profile Header Wrapper */}
      <div className="max-w-4xl mx-auto mt-6 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Banner */}
        <div 
          className="h-64 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${profileDetails.cover})` }}
        >
          {/* Cover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        {/* Profile Details Area */}
        <div className="px-8 pb-8 relative">
          {/* Avatar Area (overlapping the cover) */}
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 -mt-20 z-10 relative">
            <img 
              src={profileDetails.avatar}
              alt="Avatar"
              className="w-36 h-36 rounded-full border-4 border-white object-cover shadow-lg bg-gray-200"
            />
            {isOwnProfile && (
              <button 
                onClick={() => setShowEditModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 md:mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Chỉnh sửa trang cá nhân
              </button>
            )}
          </div>

          {/* User Text Information (rendered fully below the cover banner) */}
          <div className="mt-5 space-y-3">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {user.full_name || "Nguyễn Văn A"}
            </h1>
            
            {/* Contact Information */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email || "nva@gmail.com"}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {profileDetails.phone || "Chưa cập nhật SĐT"}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profileDetails.location || "Chưa cập nhật địa điểm"}
              </span>
              {profileDetails.website ? (
                <a href={`https://${profileDetails.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {profileDetails.website}
                </a>
              ) : (
                <span className="flex items-center gap-1.5 text-gray-400 italic">
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Chưa cập nhật website
                </span>
              )}
            </div>

            {/* Bio (rendered as plain black text below contact details, with no blue background/border) */}
            {profileDetails.bio && (
              <p className="text-gray-800 text-sm font-semibold mt-2">
                {profileDetails.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-4xl mx-auto mt-8 px-4 space-y-6">
        {/* Ban/Delete Banner */}
        {(user.status === "Banned" || user.status === "Deleted") && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-red-800">
                Tài khoản này đã bị {user.status === "Banned" ? "Khóa (Ban)" : "Xóa"}
              </h3>
              <p className="text-sm text-red-700 mt-1 font-semibold">
                Lý do: {user.ban_reason || (user.status === "Deleted" ? "Tài khoản bị xóa bởi quản trị viên" : "Vi phạm quy chuẩn hệ thống")}
              </p>
            </div>
          </div>
        )}

        {/* Alert Message */}
        {message && (
          <div className={`p-4 rounded-xl text-center font-bold text-sm border flex items-center justify-center gap-2 ${message.includes("✅") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="ml-auto font-black text-gray-400 hover:text-gray-700">×</button>
          </div>
        )}

        {/* Content Toggle: Hide lists if viewed by others when Banned/Deleted */}
        {!isOwnProfile && (user.status === "Banned" || user.status === "Deleted") ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-500 font-bold">
            Không thể hiển thị bài đăng tuyển dụng của tài khoản đã bị khóa hoặc xóa.
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <span className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Bài đăng tuyển dụng
              </span>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-700 font-extrabold text-sm rounded-full border border-blue-100">
                Tổng số bài đã đăng: {postedJobs.length} bài
              </span>
            </div>

            {/* Vertical Job list */}
            {loadingJobs ? (
              <div className="text-center py-12 text-gray-500">Đang tải danh sách công việc...</div>
            ) : postedJobs.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-500">
                Bạn chưa đăng tuyển bất kỳ công việc nào.
              </div>
            ) : (
              <div className="space-y-4">
                {postedJobs.map((job) => {
                  const jobId = job.job_id || job._id;
                  const isDeleted = job.status === "deleted" || job.status === "hidden";
                  
                  return (
                    <div key={jobId} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                      {/* Header info */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/job/${jobId}`)}>
                            {job.job_title}
                          </h3>
                          <p className="text-sm font-semibold text-gray-400 mt-1">
                            {job.company_name}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          isDeleted 
                            ? "bg-red-50 text-red-700 border border-red-100" 
                            : job.status === "waiting" 
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-100" 
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {isDeleted ? "Tạm ẩn" : job.status === "waiting" ? "Chờ duyệt" : "Đang tuyển"}
                        </span>
                      </div>

                      {/* Metadata details */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Năng lực: {job.salary || "Thỏa thuận"}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.area || "Toàn quốc / Remote"}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTimeAgo(job.createdAt)}
                        </span>
                      </div>

                      {/* Owner Action Bar */}
                      {isOwnProfile && (
                        <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-1">
                          <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                            👥 {job.appCount || 0} lượt ứng tuyển
                          </span>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate(`/edit-job/${jobId}`)}
                              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition-all"
                            >
                              Sửa
                            </button>
                            {isDeleted ? (
                              <button 
                                onClick={() => handleRestoreJob(jobId)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                              >
                                Khôi phục
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleDeleteJob(jobId)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                              >
                                Tạm ẩn (Xóa)
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa trang cá nhân</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 font-bold text-lg text-gray-400 hover:text-gray-600 transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.full_name} 
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={editForm.email} 
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio / Giới thiệu ngắn</label>
                <textarea 
                  rows={3}
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Ví dụ: Fullstack Developer & Founder tại TechLab"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={editForm.phone} 
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Địa điểm (Location)</label>
                  <input 
                    type="text" 
                    value={editForm.location} 
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Website link</label>
                <input 
                  type="text" 
                  value={editForm.website} 
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                />
              </div>

              <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-sm transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:bg-gray-300"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;