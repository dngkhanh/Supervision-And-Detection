import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router-dom';

const initialState = {
  job_title: "",
  company_name: "",
  closed_date: "",
  salary: "",
  area: "",
  experience: "Không yêu cầu kinh nghiệm",
  degree: "",
  post_user_id: "",
  description: "",
  requirements: "",
  benefits: "",
};

const CreateJob = () => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Prefer decoding user id from accessToken, fallback to localStorage 'user_id'
    const token = localStorage.getItem('accessToken');
    let uid = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        uid = payload.user_id || payload.id || payload._id || null;
      } catch (e) {
        console.warn('Cannot decode accessToken to get user id', e);
      }
    }
    if (!uid) {
      uid = localStorage.getItem('user_id');
    }
    if (!uid) {
      navigate('/login');
      return;
    }
    setUserId(uid);
    setForm((f) => ({ ...f, post_user_id: uid }));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // If this is a textarea, auto-resize
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Placeholder API - replace with your real endpoint
      // Build payload matching server model (server will assign job_id)
      const payload = {
        job_title: form.job_title,
        company_name: form.company_name,
        closed_date: form.closed_date || undefined,
        salary: form.salary,
        area: form.area,
        experience: form.experience,
        degree: form.degree,
  post_user_id: Number(form.post_user_id) || Number(userId),
        description: form.description,
        requirements: form.requirements,
        benefits: form.benefits,
      };

      const res = await axiosClient.post("/job/job", payload);
      setMessage("Tạo việc thành công!");
      setForm(initialState);
      console.log("Create job response:", res.data);
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi khi tạo việc. Kiểm tra console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tạo việc mới</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêu đề công việc</label>
            <input name="job_title" value={form.job_title} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tên công ty</label>
            <input name="company_name" value={form.company_name} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Khu vực</label>
              <input name="area" value={form.area} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mức lương</label>
              <input name="salary" value={form.salary} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kinh nghiệm</label>
              <select name="experience" value={form.experience} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base bg-white">
                <option value="Không yêu cầu kinh nghiệm">Không yêu cầu kinh nghiệm</option>
                <option value="Dưới 1 năm">Dưới 1 năm</option>
                <option value="1-2 năm">1-2 năm</option>
                <option value="2-4 năm">2-4 năm</option>
                <option value="5 năm trở lên">5 năm trở lên</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bằng cấp</label>
              <input name="degree" value={form.degree} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày đóng</label>
            <input type="date" name="closed_date" value={form.closed_date} onChange={handleChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm px-4 py-3 text-base" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={5} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-base resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Yêu cầu</label>
            <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-base resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quyền lợi</label>
            <textarea name="benefits" value={form.benefits} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm px-4 py-3 text-base resize-none" />
          </div>

          {/* post_user_id được gán tự động từ user đã đăng nhập */}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
              {loading ? "Đang tạo..." : "Tạo việc"}
            </button>
            <button type="button" onClick={() => setForm(initialState)} className="px-4 py-2 border rounded-md">Reset</button>
          </div>

          {message && <div className="text-sm text-gray-700 mt-2">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
