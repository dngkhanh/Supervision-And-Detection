import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRoleId, setCurrentUserRoleId] = useState(null);
  const [applicantCount, setApplicantCount] = useState(0);
  const [cvList, setCvList] = useState([]);

  // Modal xác nhận
  const [confirmType, setConfirmType] = useState(null); // 'approve' | 'delete' | null

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1
    ).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const normalizeStatus = (val) => {
    if (!val) return null;
    const s = String(val).toLowerCase().trim();
    const map = {
      available: 'available',
      active: 'available',
      'còn hạn': 'available',
      waiting: 'waiting',
      pending: 'waiting',
      'chờ duyệt': 'waiting',
      outdated: 'outdated',
      expired: 'outdated',
      'hết hạn': 'outdated',
      deleted: 'deleted',
      removed: 'deleted',
      'đã xóa': 'deleted',
      '1': 'available',
      '2': 'waiting',
      '3': 'outdated',
      '4': 'deleted',
      true: 'deleted',
    };
    return map[s] || null;
  };

  const statusMap = {
    available: { label: 'Còn hạn', cls: 'bg-emerald-50 text-emerald-700' },
    outdated: { label: 'Hết hạn', cls: 'bg-rose-50 text-rose-700' },
    waiting: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700' },
    deleted: { label: 'Đã xóa', cls: 'bg-gray-100 text-gray-600' },
  };

  const rawStatus =
    job?.job_status ??
    job?.status ??
    job?.state ??
    (job?.is_deleted ? 'deleted' : null) ??
    (job?.is_waiting ? 'waiting' : null);

  const status = statusMap[normalizeStatus(rawStatus)] || null;

  // ===== LẤY USER HIỆN TẠI =====
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosClient.get('/user/user/me');
        setCurrentUserId(res.data.user.user_id);
        setCurrentUserRoleId(res.data.user.role_id); // <-- lấy role_id
      } catch {
        setCurrentUserId(null);
        setCurrentUserRoleId(null);
      }
    };
    fetchMe();
  }, []);

  // ===== LẤY JOB + CHECK APPLY =====
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobRes, checkRes] = await Promise.all([
          axiosClient.get(`/job/job/${id}`),
          axiosClient
            .get(`/application/application/check-applied/${id}`)
            .catch(() => ({ data: { applied: false } })),
        ]);

        setJob(jobRes.data);
        setHasApplied(!!checkRes.data?.applied);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate('/login');
          return;
        }
        setError('Không thể tải thông tin công việc.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // ===== CHỈ CHỦ JOB MỚI LẤY DS CV =====
  useEffect(() => {
    if (!job || !currentUserId) return;

    if (currentUserId === job.post_user_id) {
      axiosClient
        .get(`/application/application/applier-cv/${id}`)
        .then((res) => {
          setApplicantCount(res.data.count || 0);
          setCvList(res.data.data || []);
        })
        .catch(() => {
          setApplicantCount(0);
          setCvList([]);
        });
    }
  }, [job, currentUserId, id]);

  // ===== ỨNG TUYỂN =====
  const handleApply = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Vui lòng đăng nhập để ứng tuyển.');
      navigate('/login');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn ứng tuyển công việc này?')) return;

    setIsApplying(true);
    try {
      await axiosClient.post('/application/application/apply', {
        job_id: id,
      });
      alert('Ứng tuyển thành công!');
      setHasApplied(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Ứng tuyển thất bại.');
    } finally {
      setIsApplying(false);
    }
  };

  // ===== HỦY ỨNG TUYỂN =====
  const handleCancelApply = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy ứng tuyển?')) return;

    setIsApplying(true);
    try {
      await axiosClient.delete('/application/application/cancel-applied', {
        data: { job_id: id },
      });
      alert('Đã hủy ứng tuyển.');
      setHasApplied(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Hủy ứng tuyển thất bại.');
    } finally {
      setIsApplying(false);
    }
  };

  // ===== TẢI CV TỪNG CÁI – TỪNG CÁI =====
  const handleDownloadCVs = async () => {
    if (!cvList.length) {
      alert('Chưa có CV nào');
      return;
    }

    setIsApplying(true);

    for (let i = 0; i < cvList.length; i++) {
      const cv = cvList[i];

      const link = document.createElement('a');
      link.href = cv.cv_path;
      link.download = `CV_${cv.user_id}_${i + 1}.pdf`;
      document.body.appendChild(link);

      link.click();
      link.remove();

      // ⏳ delay 1s để tránh browser block
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsApplying(false);
  };

  // ===== DUYỆT JOB =====
  const handleApproveJob = async () => {
    setIsApplying(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axiosClient.post(
        '/job/job/accept',
        { job_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJob((prev) => ({ ...prev, status: 'approved' }));
      setConfirmType(null);
      navigate('/admin/jobs'); // <-- quay lại trang admin
    } catch (err) {
      console.error(err.response?.data?.message || 'Duyệt công việc thất bại.');
    } finally {
      setIsApplying(false);
    }
  };

  // ===== XÓA JOB =====
  const handleDeleteJob = async () => {
    setIsApplying(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axiosClient.post(
        '/job/job/refuse',
        { job_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmType(null);
      navigate('/admin/jobs'); // <-- quay lại trang admin
    } catch (err) {
      console.error(err.response?.data?.message || 'Xóa công việc thất bại.');
    } finally {
      setIsApplying(false);
    }
  };

  // ===== RENDER =====
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 text-center">Đang tải dữ liệu...</div>
      </div>
    );

  if (error || !job)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 text-red-500 text-center">
          {error || 'Không tìm thấy công việc'}
        </div>
      </div>
    );

  const closedDateStr = formatDate(job.closed_date || job.closedDate);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full flex items-start justify-center py-6">
        <div className="w-full max-w-4xl mx-4">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-3xl">
                {(job.company_name || 'C').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-extrabold">{job.job_title}</h1>
                <p className="text-blue-600 font-medium mt-1">
                  {job.company_name}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                {/* USER THƯỜNG */}
                {currentUserId !== job.post_user_id && (
                  <button
                    onClick={hasApplied ? handleCancelApply : handleApply}
                    disabled={isApplying}
                    className={`px-6 py-3 rounded-lg font-bold text-white ${
                      hasApplied ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                  >
                    {hasApplied ? 'Hủy ứng tuyển' : 'Ứng tuyển ngay'}
                  </button>
                )}

                {/* CHỦ JOB */}
                {currentUserId === job.post_user_id && (
                  <button
                    onClick={handleDownloadCVs}
                    disabled={isApplying}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                  >
                    {isApplying
                      ? 'Đang tải CV...'
                      : `Tải CV (${applicantCount} người)`}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {status && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${status.cls}`}
                >
                  📢 {status.label}
                </span>
              )}
            </div>

            <hr className="my-8" />

            <section>
              <h2 className="text-xl font-bold mb-2">Mô tả công việc</h2>
              <div className="text-gray-700 whitespace-pre-line">
                {job.description || 'Chưa có mô tả'}
              </div>
            </section>

            {/* YÊU CẦU CÔNG VIỆC */}
            <section className="mt-6">
              <h2 className="text-xl font-bold mb-2">Yêu cầu công việc</h2>
              <div className="text-gray-700 whitespace-pre-line">
                {job.requirements || 'Chưa có yêu cầu'}
              </div>
            </section>

            {/* QUYỀN LỢI */}
            <section className="mt-6">
              <h2 className="text-xl font-bold mb-2">Quyền lợi</h2>
              <div className="text-gray-700 whitespace-pre-line">
                {job.benefits || 'Chưa có quyền lợi'}
              </div>
            </section>

            {closedDateStr && (
              <div className="mt-6 text-gray-600 italic">
                Hạn nộp hồ sơ:{' '}
                <span className="font-semibold text-red-500">
                  {closedDateStr}
                </span>
              </div>
            )}

            {/* NÚT DUYỆT & XÓA – chỉ hiển thị khi status=waiting và role_id=1 */}
            {job.status === 'waiting' && currentUserRoleId === 1 && (
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmType('approve')}
                  disabled={isApplying}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => setConfirmType('delete')}
                  disabled={isApplying}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Xóa
                </button>
              </div>
            )}

            {/* Modal xác nhận */}
            {confirmType && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-2">
                      {confirmType === 'approve'
                        ? 'Xác nhận duyệt công việc'
                        : 'Xác nhận xóa công việc'}
                    </h3>
                    <p className="text-gray-600">
                      {confirmType === 'approve'
                        ? 'Bạn có muốn duyệt công việc này không?'
                        : 'Bạn có muốn xóa công việc này không?'}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setConfirmType(null)}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                      >
                        Hủy
                      </button>
                      {confirmType === 'approve' ? (
                        <button
                          onClick={handleApproveJob}
                          disabled={isApplying}
                          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          Duyệt
                        </button>
                      ) : (
                        <button
                          onClick={handleDeleteJob}
                          disabled={isApplying}
                          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
