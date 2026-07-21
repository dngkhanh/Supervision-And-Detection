import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

const animalAvatars = [
  "https://media.giphy.com/media/v6aOjy0Qo1fIA/giphy.gif", // mèo
  "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif", // chó
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif", // gấu
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // thỏ
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");
  const roleId = Number(localStorage.getItem("role_id"));

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
              to="/admin/jobs"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Quản trị việc làm
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
          <div className="relative">
            <img
              src={avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full cursor-pointer border object-cover hover:scale-110 transition"
              onClick={() => setOpen(!open)}
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
        )}
      </div>
    </div>
  );
};

export default Navbar;
