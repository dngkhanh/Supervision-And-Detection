import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import React from "react";
import Navbar from "../components/Navbar";

const UserProfile = () => {
  const [user, setUser] = useState({
    user_id: "",
    username: "",
    full_name: "",
    email: "",
    cv_path: "",
    role_id: ""
  });

  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const UserId = localStorage.getItem("user_id");

  // 1. Lấy thông tin người dùng từ server
  const fetchUser = async () => {
    try {
      const res = await axiosClient.get("/user/user/me");
      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Lỗi fetch user:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // 2. HÀM QUAN TRỌNG: Tải CV về máy không bị lỗi "Failed to load"
const handleDownloadCV = () => {
  if (!user.cv_path) {
    setMessage("❌ Không tìm thấy đường dẫn file CV.");
    return;
  }

  try {
    setMessage("⏳ Đang tải xuống...");

    // CÔNG THỨC: Chèn "/fl_attachment/" vào sau "/upload/"
    // Link gốc: .../image/upload/v123/cv.pdf
    // Link tải: .../image/upload/fl_attachment/v123/cv.pdf
    const downloadUrl = user.cv_path.replace("/upload/", "/upload/fl_attachment/");

    // Tạo link ảo để ép trình duyệt tải xuống thay vì mở tab mới
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `CV_${user.full_name || "User"}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage("✅ Đã kích hoạt tải xuống!");
  } catch (err) {
    console.error("Lỗi tải CV:", err);
    setMessage("❌ Lỗi khi tải file.");
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // 3. Cập nhật thông tin và upload CV mới
  const handleUpdate = async () => {
    setLoading(true);
    setMessage("");
    try {
      // Cập nhật thông tin text
      await axiosClient.put(`/user/user/${UserId}`, user);

      // Nếu có chọn file mới thì mới upload lên Cloudinary
      if (cvFile) {
        const formData = new FormData();
        formData.append("cv", cvFile);
        const uploadRes = await axiosClient.post(`/user/user/upload-cv`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        if (uploadRes.data && uploadRes.data.cv_path) {
          setUser(prev => ({ ...prev, cv_path: uploadRes.data.cv_path }));
        }
      }

      setMessage("✅ Thông tin tài khoản đã được lưu lại!");
      await fetchUser(); // Đồng bộ lại dữ liệu từ DB
      setCvFile(null);
    } catch (err) {
      console.error("Lỗi update:", err);
      setMessage("❌ Có lỗi xảy ra khi lưu thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />
      <div className="max-w-xl mx-auto bg-white p-8 mt-10 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Cài đặt tài khoản</h2>

        <div className="space-y-6">
          {/* Form Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Username</label>
            <input type="text" name="username" value={user.username || ""} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Họ và tên</label>
            <input type="text" name="full_name" value={user.full_name || ""} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
            <input type="email" name="email" value={user.email || ""} onChange={handleChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Phần quản lý CV */}
          <div className="pt-6 border-t mt-6">
            <label className="block text-sm font-bold text-gray-700 mb-4">HỒ SƠ NĂNG LỰC (CV)</label>
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
              
              {user.cv_path ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-100 mb-5 shadow-sm">
                  <div className="flex items-center text-blue-600 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>CV_Hien_Tai.pdf</span>
                  </div>
                  
                  {/* Nút tải về sử dụng hàm Blob */}
                  <button 
                    onClick={handleDownloadCV}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    TẢI VỀ MÁY
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm italic mb-2">Bạn chưa tải CV lên hệ thống</div>
              )}

              <div className="mt-2">
                <span className="text-[11px] text-gray-500 font-bold uppercase block mb-2">Tải lên file mới:</span>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files[0])} 
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold hover:file:bg-indigo-100 cursor-pointer" 
                />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleUpdate} 
          disabled={loading} 
          className="w-full mt-10 py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black disabled:bg-gray-400 transition-all flex justify-center items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ĐANG LƯU...
            </>
          ) : "LƯU TẤT CẢ THAY ĐỔI"}
        </button>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center font-bold text-sm border ${message.includes("✅") ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;