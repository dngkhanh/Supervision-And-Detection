import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const animalAvatars = [
  "https://media.giphy.com/media/v6aOjy0Qo1fIA/giphy.gif", // mèo
  "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif", // chó
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif", // gấu
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // thỏ
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [fullName, setFullName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");
  const roleId = Number(localStorage.getItem("role_id"));

  useEffect(() => {
    if (token) {
      axiosClient
        .get("/user/me")
        .then((res) => {
          setFullName(res.data?.user?.full_name || "");
        })
        .catch(() => {});
        
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = () => {
    axiosClient.get("/user/notifications")
      .then(res => {
        setNotifications(res.data?.data || []);
      })
      .catch(() => {});
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = (id) => {
    axiosClient.put(`/user/notification/${id}/read`)
      .then(() => {
        fetchNotifications();
      })
      .catch(() => {});
  };

  // 🎲 random avatar nhưng chỉ random 1 lần
  const avatar = useMemo(() => {
    return animalAvatars[Math.floor(Math.random() * animalAvatars.length)];
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role_id");
    navigate("/login");
  };

  return (
    <div className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-blue-600">
            JobFinder
          </Link>

          <Link
            to="/"
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Tìm việc
          </Link>

          <button
            onClick={() => {
              const token = localStorage.getItem('accessToken');
              const userId = localStorage.getItem('user_id');
              if (!token || !userId) {
                // redirect to login if not authenticated
                navigate('/login');
                return;
              }
              // else navigate to candidates
              navigate('/candidates');
            }}
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Tìm ứng viên
          </button>

          <button
            onClick={() => {
              const token = localStorage.getItem('accessToken');
              const userId = localStorage.getItem('user_id');
              if (!token || !userId) {
                navigate('/login');
                return;
              }
              navigate('/my-jobs');
            }}
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Công việc của tôi
          </button>

          {roleId === 1 && (
            <Link
              to="/admin/dashboard"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Quản trị (Admin)
            </Link>
          )}
        </div>

        {/* RIGHT */}
        {!token ? (
          <div className="flex gap-4 items-center">
            <Link
              to="/register"
              className="text-gray-700 hover:text-blue-600"
            >
              Đăng ký
            </Link>

            <Link
              to="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Đăng nhập
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="text-gray-600 hover:text-blue-600 focus:outline-none relative mt-1"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setOpen(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
                    <span className="font-bold text-gray-700">Thông báo</span>
                    <button onClick={fetchNotifications} className="text-xs text-blue-600 hover:underline">Tải lại</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-center text-gray-500">Chưa có thông báo nào</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.notification_id} 
                          className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
                          onClick={() => handleMarkRead(notif.notification_id)}
                        >
                          <p className={`text-sm ${notif.is_read ? 'text-gray-600' : 'font-semibold text-gray-800'}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {fullName && <span className="text-sm font-medium text-gray-700">Xin chào, {fullName}</span>}
            <div className="relative">
              <img
                src={avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full cursor-pointer border object-cover hover:scale-110 transition"
                onClick={() => {
                  setOpen(!open);
                  setShowNotifications(false);
                }}
              />

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white border rounded-md shadow-md overflow-hidden">
                <Link
                  to="/profile"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  👤 Hồ sơ cá nhân
                </Link>

                {/* Đã chuyển “Quản trị việc làm” lên LEFT, bỏ khỏi menu avatar */}

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
