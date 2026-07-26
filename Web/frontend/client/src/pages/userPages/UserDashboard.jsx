import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserHome = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-green-600">Xin chào, User!</h1>
            <button 
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition"
            >
                Đăng Xuất
            </button>
        </div>

        <div className="prose">
            <p className="text-lg text-gray-700">
                Đây là trang chủ dành cho thành viên thông thường.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-600">
                <li>Xem thông tin cá nhân</li>
                <li>Lịch sử mua hàng</li>
                <li>Cập nhật hồ sơ</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default UserHome;