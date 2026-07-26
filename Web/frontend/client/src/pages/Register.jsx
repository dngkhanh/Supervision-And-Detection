import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axiosClient from '../api/axiosClient';
const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', name: '', username: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordsMatch = form.password && form.confirm && form.password === form.confirm;
  const passwordValidLength = form.password && form.password.length >= 8;

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // basic client-side validation
  if (!form.email || !form.password || !form.full_name || !form.confirm || !form.username) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (!passwordValidLength) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    if (!passwordsMatch) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }

    // Call backend register API
    try {
      setLoading(true);
      const payload = { full_name: form.full_name, email: form.email, password: form.password, username: form.username };
      const res = await axiosClient.post('/user/user/register', payload);
      // show success message then redirect
      setSuccess('Đăng ký thành công! Chuyển hướng sang đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Register error', err);
      const msg = err?.response?.data?.message || err.message || 'Đăng ký thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Tạo tài khoản</h1>
          {success && <div className="mb-3 text-green-700 bg-green-100 border border-green-200 px-3 py-2 rounded">{success}</div>}
          {error && <div className="mb-3 text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Họ và Tên</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block text-sm mb-1">Tên đăng nhập</label>
              <input name="username" value={form.username} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block text-sm mb-1">Mật khẩu</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>

            <div>
              <label className="block text-sm mb-1">Xác nhận mật khẩu</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handleChange} className={`w-full border px-3 py-2 rounded focus:outline-none ${form.confirm ? (passwordsMatch ? 'ring-2 ring-green-300' : 'ring-2 ring-red-300') : 'focus:ring-2 focus:ring-blue-200'}`} />
              {form.password && !passwordValidLength && (
                <p className="text-xs text-red-600 mt-1">Mật khẩu phải có ít nhất 8 ký tự</p>
              )}
              {form.confirm && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Mật khẩu không khớp</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">Đã có tài khoản? <button type="button" onClick={() => navigate('/login')} className="text-blue-600 underline">Đăng nhập</button></div>
              <button type="submit" disabled={!passwordsMatch || !passwordValidLength || loading} className={`px-4 py-2 rounded text-white ${(passwordsMatch && passwordValidLength) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                {loading ? 'Đang gửi...' : 'Đăng ký'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
