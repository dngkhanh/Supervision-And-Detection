import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // Xóa sạch token và role
    navigate('/login');   // Quay về login
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center border-b border-gray-600 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-blue-400">Admin Dashboard</h1>
            <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold transition"
            >
                Đăng Xuất
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Thống kê User</h3>
                <p className="text-gray-300">Quản lý danh sách người dùng...</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Cài đặt hệ thống</h3>
                <p className="text-gray-300">Cấu hình các tham số...</p>
            </div>
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Báo cáo</h3>
                <p className="text-gray-300">Xem doanh thu và traffic...</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;