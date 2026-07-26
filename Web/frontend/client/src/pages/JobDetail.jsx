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

  const [confirmType, setConfirmType] = useState(null); // 'approve' | 'delete' | null
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCvListModal, setShowCvListModal] = useState(false);
  const [selectedCvs, setSelectedCvs] = useState([]);
  const [selectedCvFile, setSelectedCvFile] = useState(null);

  // States cho modal lý do xóa bài đăng của Admin
  const [checkedReasons, setCheckedReasons] = useState({
    fakeInfo: false,
    badLanguage: false,
    wrongCategory: false,
    forbiddenJob: false,
    other: false,
  });
  const [otherReasonText, setOtherReasonText] = useState("");

  const [posterName, setPosterName] = useState("Đang tải...");
  const [posterUsername, setPosterUsername] = useState("");

  useEffect(() => {
    if (job?.post_user_id) {
      axiosClient.get(`/user/user/info/${job.post_user_id}`)
        .then(res => {
          setPosterName(res.data?.data?.full_name || "Nhà tuyển dụng");
          setPosterUsername(res.data?.data?.username || "");
        })
        .catch(() => {
          setPosterName("Nhà tuyển dụng");
          setPosterUsername("");
        });
    }
  }, [job]);

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
  const openApplyModal = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Vui lòng đăng nhập để ứng tuyển.');
      navigate('/login');
      return;
    }
    setShowApplyModal(true);
  };

  const handleApplySubmit = async () => {
    if (!selectedCvFile) {
      alert('Vui lòng chọn file CV (PDF) để ứng tuyển.');
      return;
    }

    setIsApplying(true);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('cv', selectedCvFile);

      const uploadRes = await axiosClient.post('/user/user/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadData = uploadRes.data;

      // 2. Gọi API ứng tuyển
      await axiosClient.post('/application/application/apply', {
        job_id: id,
        cv_path: uploadData.url,
        original_filename: uploadData.original_filename
      });

      alert('Ứng tuyển thành công!');
      setHasApplied(true);
      setShowApplyModal(false);
      setSelectedCvFile(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Ứng tuyển thất bại.');
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

  // ===== TẢI HÀNG LOẠT CV BẰNG ZIP =====
  const handleDownloadSelectedCVs = async () => {
    const cvsToDownload = cvList.filter(cv => selectedCvs.includes(cv.user_id));

    if (!cvsToDownload.length) {
      alert('Vui lòng chọn ít nhất một CV để tải.');
      return;
    }

    setIsApplying(true);

    try {
      // 1. Gửi request lấy file ZIP
      const response = await axiosClient.post('/application/application/download-zip', {
        cvs: cvsToDownload
      }, {
        responseType: 'blob' // Trả về dạng Binary
      });

      // 2. Tạo tên file zip linh động
      const safeJobTitle = job?.title ? job.title.replace(/[^a-zA-Z0-9]/g, '_') : 'Job';
      const today = new Date();
      const dateStr = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
      const zipFilename = `CVs_${safeJobTitle}_${dateStr}.zip`;

      // 3. Xử lý tải file
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 4. Gửi thông báo cho từng ứng viên (chạy ngầm không cần chờ)
      cvsToDownload.forEach(cv => {
        axiosClient.post('/user/user/notification', {
          user_id: cv.user_id,
          message: `CV của bạn ứng tuyển vào vị trí "${job?.title || 'một công việc'}" đã được nhà tuyển dụng tải về.`
        }).catch(err => console.error("Lỗi báo cáo tải CV:", err));
      });

      setShowCvListModal(false);
      alert(`Đã tải thành công file ${zipFilename}!`);

    } catch (err) {
      console.error("Lỗi khi tải file ZIP:", err);
      alert("Có lỗi xảy ra khi tạo file nén.");
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
    const reasonsMap = {
      fakeInfo: "Nội dung chứa thông tin sai sự thật, lừa đảo hoặc spam.",
      badLanguage: "Ngôn từ không phù hợp, vi phạm tiêu chuẩn cộng đồng.",
      wrongCategory: "Sai danh mục ngành nghề hoặc sai định dạng quy định.",
      forbiddenJob: "Bài đăng tuyển các vị trí bị cấm (đa cấp biến tướng, tài chính bất hợp pháp,...)."
    };

    let compiledReasons = Object.keys(checkedReasons)
      .filter(k => k !== 'other' && checkedReasons[k])
      .map(k => reasonsMap[k]);

    if (checkedReasons.other && otherReasonText.trim()) {
      compiledReasons.push(otherReasonText.trim());
    }

    const reason = compiledReasons.join('; ') || 'Vi phạm chính sách sàn giao dịch.';

    setIsApplying(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axiosClient.post(
        '/job/job/refuse',
        { job_id: id, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmType(null);

      // Reset states
      setCheckedReasons({
        fakeInfo: false,
        badLanguage: false,
        wrongCategory: false,
        forbiddenJob: false,
        other: false,
      });
      setOtherReasonText("");

      navigate('/admin/jobs'); // <-- quay lại trang admin
    } catch (err) {
      console.error(err.response?.data?.message || 'Xóa công việc thất bại.');
      alert(err.response?.data?.message || 'Xóa công việc thất bại.');
    } finally {
      setIsApplying(false);
    }
  };

  // ===== RENDER =====
  const handleOwnerAction = async (action) => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Bạn có chắc muốn ẩn công việc này?')) return;
        await axiosClient.put(`/job/job/${id}/soft-delete`);
        setJob(prev => ({ ...prev, status: 'deleted' }));
      } else if (action === 'restore') {
        await axiosClient.put(`/job/job/${id}/restore`);
        setJob(prev => ({ ...prev, status: 'available' }));
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };
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

  const renderSectionHeader = (title, rightElement = null) => (
    <div className="flex items-center justify-between border-b pb-3 mb-4 mt-8">
      <div className="flex items-center gap-3">
        <div className="w-1 bg-[#00b14f] rounded-full" style={{ minHeight: '1.6rem', width: '4px' }}></div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {rightElement}
    </div>
  );

  const renderBulletPoints = (text) => {
    if (!text) return <li className="text-[#475467] leading-relaxed list-disc ml-5">Chưa cập nhật</li>;
    return text.split('\n').filter(line => line.trim()).map((line, idx) => {
      const cleanLine = line.replace(/^[-\*\u2022]\s*/, '').trim();
      const colonIdx = cleanLine.indexOf(':');
      if (colonIdx !== -1) {
        const prefix = cleanLine.substring(0, colonIdx + 1);
        const suffix = cleanLine.substring(colonIdx + 1);
        return (
          <li key={idx} className="text-[#475467] leading-relaxed mb-2 list-disc ml-5">
            <strong className="text-gray-900">{prefix}</strong>{suffix}
          </li>
        );
      }
      return (
        <li key={idx} className="text-[#475467] leading-relaxed mb-2 list-disc ml-5">
          {cleanLine}
        </li>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full flex items-start justify-center py-6">
        <div className="w-full max-w-4xl mx-4">
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            {/* Header info */}
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company_name}
                  className="w-20 h-20 rounded-xl object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#00b14f] flex items-center justify-center text-white font-bold text-3xl shadow-sm">
                  {(job.company_name || 'C').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-gray-900">{job.job_title}</h1>
                <p className="text-[#00b14f] font-semibold mt-1">
                  {job.company_name}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mt-3 justify-center md:justify-start border-t pt-2 border-gray-100">
                  <div>
                    <span className="text-[#00b14f] font-bold">Khu vực: </span>
                    <span className="text-gray-900 font-semibold">
                      {job.locations && job.locations.length > 0
                        ? [...new Set(job.locations.map(l => l.city))].join(", ")
                        : (job.province || 'Hồ Chí Minh')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#00b14f] font-bold">Đăng tải: </span>
                    <span 
                      onClick={() => {
                        const target = posterUsername || job?.post_user_id;
                        if (target) navigate(`/profile/${target}`);
                      }}
                      className="text-blue-600 font-semibold hover:underline cursor-pointer"
                    >
                      {posterName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#00b14f] font-bold">Hạn ứng tuyển: </span>
                    <span className="text-gray-900 font-semibold">{closedDateStr || 'Không giới hạn'}</span>
                  </div>
                </div>
                <div className="text-sm mt-2 text-center md:text-left">
                  <span className="text-[#00b14f] font-bold">Mức lương: </span>
                  <span className="text-red-600 font-extrabold">{job.salary || 'Thỏa thuận'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto">
                {/* USER THƯỜNG (Chỉ ứng tuyển khi bài đã được duyệt / available) */}
                {currentUserId !== job.post_user_id && (job.status === "available" || job.status === "active" || job.status === "còn hạn") && (
                  <button
                    onClick={hasApplied ? handleCancelApply : openApplyModal}
                    disabled={isApplying}
                    className={`px-6 py-3 rounded-lg font-bold text-white transition-all shadow hover:shadow-lg hover:-translate-y-0.5 ${hasApplied ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00b14f] hover:bg-[#009840]'
                      }`}
                  >
                    {hasApplied ? 'Hủy ứng tuyển' : 'Ứng tuyển ngay'}
                  </button>
                )}

                {/* CHỦ JOB */}
                {currentUserId === job.post_user_id && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        if (!cvList.length) {
                          alert('Chưa có CV nào');
                          return;
                        }
                        setSelectedCvs(cvList.map(cv => cv.user_id));
                        setShowCvListModal(true);
                      }}
                      disabled={isApplying}
                      className="px-6 py-3 bg-[#00b14f] hover:bg-[#009840] text-white font-bold rounded-lg transition-colors"
                    >
                      {isApplying
                        ? 'Đang xử lý...'
                        : `Tải CV (${applicantCount} người)`}
                    </button>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => navigate(`/edit-job/${id}`)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold rounded-lg transition-colors"
                      >
                        Sửa
                      </button>
                      {job.status === 'deleted' || job.status === 'hidden' ? (
                        <button
                          onClick={() => handleOwnerAction('restore')}
                          className="flex-1 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 font-bold rounded-lg transition-colors"
                        >
                          Khôi phục
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOwnerAction('delete')}
                          className="flex-1 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-lg transition-colors"
                        >
                          Xóa/Ẩn
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {status && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${status.cls}`}
                >
                  📢 {status.label}
                </span>
              )}
            </div>

            <hr className="my-8" />

            {/* KHỐI 1: TỔNG QUAN */}
            {renderSectionHeader(
              "Tổng quan công việc",
              // <button className="flex items-center gap-1.5 text-xs font-semibold text-[#00b14f] bg-green-50 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors">
              //   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              //   </svg>

              // </button>
            )}

            <div className="space-y-4 text-sm bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-400 font-medium w-24">Yêu cầu:</span>
                <span className="px-3 py-1 bg-gray-200/60 text-gray-700 font-semibold rounded-full text-xs">
                  Kinh nghiệm: {job.experience || 'Chưa cập nhật'}
                </span>
                <span className="px-3 py-1 bg-gray-200/60 text-gray-700 font-semibold rounded-full text-xs">
                  Bằng cấp: {job.degree || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap border-t pt-3">
                <span className="text-gray-400 font-medium w-24">Chuyên môn:</span>
                {job.categories && job.categories.length > 0 ? (
                  job.categories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-semibold rounded-full text-xs">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-semibold rounded-full text-xs">
                    {job.industry || 'Ngành nghề chưa cập nhật'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap border-t pt-3">
                <span className="text-gray-400 font-medium w-24">Cấp bậc:</span>
                <span className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-semibold rounded-full text-xs">
                  {job.level || 'Cấp bậc chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap border-t pt-3">
                <span className="text-gray-400 font-medium w-24">Hình thức:</span>
                <span className="px-3 py-1 bg-white border border-gray-300 text-gray-700 font-semibold rounded-full text-xs">
                  {job.work_type || 'Hình thức chưa cập nhật'}
                </span>
              </div>
            </div>

            {/* KHỐI 2: MÔ TẢ CÔNG VIỆC */}
            {renderSectionHeader("Mô tả công việc")}
            <ul className="list-inside space-y-1">
              {renderBulletPoints(job.description)}
            </ul>

            {/* KHỐI 3: YÊU CẦU CÔNG VIỆC */}
            {renderSectionHeader("Yêu cầu ứng viên")}
            <ul className="list-inside space-y-1">
              {renderBulletPoints(job.requirements)}
            </ul>
            <p className="mt-4 text-sm text-red-600 font-bold italic bg-red-50/50 p-3 rounded-lg border border-red-100">
              * Lưu ý đặc biệt: Ứng viên vui lòng chuẩn bị Portfolio đính kèm hoặc các chứng chỉ/sản phẩm demo liên quan trước khi tham gia phỏng vấn trực tiếp.
            </p>

            {/* KHỐI 4: QUYỀN LỢI */}
            {renderSectionHeader("Quyền lợi ứng viên")}
            <ul className="list-inside space-y-1">
              <li className="text-gray-900 font-extrabold leading-relaxed mb-2 list-disc ml-5">
                Mức lương: {job.salary || 'Thỏa thuận'} (thỏa thuận theo năng lực)
              </li>
              {renderBulletPoints(job.benefits)}
            </ul>

            {/* KHỐI 5: ĐỊA ĐIỂM VÀ THỜI GIAN */}
            {renderSectionHeader("Địa điểm & Thời gian")}
            <div className="space-y-4 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">📍 Địa điểm làm việc</h4>
                <ul className="space-y-1">
                  {job.locations && job.locations.length > 0 ? (
                    job.locations.map((loc, idx) => (
                      <li key={idx} className="text-[#475467] leading-relaxed list-disc ml-5">
                        {loc.addressDetail}{loc.district ? `, ${loc.district}` : ''}{loc.city ? `, ${loc.city}` : ''}
                      </li>
                    ))
                  ) : (
                    <li className="text-[#475467] leading-relaxed list-disc ml-5">
                      {job.address || 'Địa chỉ cụ thể'}{job.district ? `, ${job.district}` : ''}{job.province ? `, ${job.province}` : ''}
                    </li>
                  )}
                </ul>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-bold text-gray-900 mb-2">⏰ Thời gian làm việc</h4>
                <ul className="space-y-1">
                  <li className="text-[#475467] leading-relaxed list-disc ml-5">
                    {job.working_time || "Thứ 2 - Thứ 6 từ 08:00 đến 17:00 (Nghỉ Thứ 7 và Chủ Nhật)"}
                  </li>
                </ul>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-sm font-bold text-gray-900 mb-2">📬 Cách thức ứng tuyển</h4>
                <ul className="space-y-1">
                  <li className="text-[#475467] leading-relaxed list-disc ml-5">
                    Ứng viên thực hiện nhấn nút <strong className="text-[#00b14f]">Ứng tuyển trực tuyến</strong> phía bên trên để gửi hồ sơ trực tiếp tới bộ phận Nhân sự của công ty.
                  </li>
                </ul>
              </div>
            </div>

            {closedDateStr && (
              <div className="mt-6 text-gray-600 italic">
                Hạn nộp hồ sơ:{' '}
                <span className="font-semibold text-red-500">
                  {closedDateStr}
                </span>
              </div>
            )}

            {/* NÚT DUYỆT & XÓA cho ADMIN */}
            {currentUserRoleId === 1 && (
              <div className="mt-8 flex justify-end gap-3">
                {job.status === 'waiting' && (
                  <button
                    onClick={() => setConfirmType('approve')}
                    disabled={isApplying}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all hover:scale-105"
                  >
                    Duyệt bài
                  </button>
                )}
                {(job.status === 'waiting' || job.status === 'available') && (
                  <button
                    onClick={() => setConfirmType('delete')}
                    disabled={isApplying}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all hover:scale-105"
                  >
                    Gỡ/Xóa bài
                  </button>
                )}
              </div>
            )}

            {/* Modal xác nhận */}
            {confirmType && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-lg shadow-xl overflow-hidden">
                  <div className="p-6">
                    {confirmType === 'approve' ? (
                      <>
                        <h3 className="text-lg font-bold mb-2 text-gray-800">Xác nhận duyệt công việc</h3>
                        <p className="text-gray-600">Bạn có muốn duyệt công việc này không?</p>
                        <div className="mt-6 flex justify-end gap-3">
                          <button
                            onClick={() => setConfirmType(null)}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleApproveJob}
                            disabled={isApplying}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold"
                          >
                            Duyệt
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">
                          Xác nhận gỡ bỏ bài đăng tuyển dụng
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 font-medium">Vui lòng chọn lý do gỡ bỏ bài đăng tuyển dụng này:</p>

                        <div className="space-y-3 mb-4">
                          <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checkedReasons.fakeInfo}
                              onChange={(e) => setCheckedReasons(prev => ({ ...prev, fakeInfo: e.target.checked }))}
                              className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span>Nội dung chứa thông tin sai sự thật, lừa đảo hoặc spam.</span>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checkedReasons.badLanguage}
                              onChange={(e) => setCheckedReasons(prev => ({ ...prev, badLanguage: e.target.checked }))}
                              className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span>Ngôn từ không phù hợp, vi phạm tiêu chuẩn cộng đồng.</span>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checkedReasons.wrongCategory}
                              onChange={(e) => setCheckedReasons(prev => ({ ...prev, wrongCategory: e.target.checked }))}
                              className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span>Sai danh mục ngành nghề hoặc sai định dạng quy định.</span>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={checkedReasons.forbiddenJob}
                              onChange={(e) => setCheckedReasons(prev => ({ ...prev, forbiddenJob: e.target.checked }))}
                              className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span>Bài đăng tuyển các vị trí bị cấm (đa cấp biến tướng, tài chính bất hợp pháp,...).</span>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-700 border-t pt-2 mt-2">
                            <input
                              type="checkbox"
                              checked={checkedReasons.other}
                              onChange={(e) => setCheckedReasons(prev => ({ ...prev, other: e.target.checked }))}
                              className="mt-1 w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span className="font-semibold text-gray-800">Lý do khác (Nhập chi tiết ở ô dưới)</span>
                          </label>
                        </div>

                        {/* TextArea lý do khác */}
                        <div className="mb-6">
                          <textarea
                            disabled={!checkedReasons.other}
                            value={otherReasonText}
                            onChange={(e) => setOtherReasonText(e.target.value)}
                            placeholder="Vui lòng nhập lý do chi tiết để thông báo cho nhà tuyển dụng..."
                            rows={3}
                            className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${checkedReasons.other
                              ? 'bg-white border-red-300 text-gray-800'
                              : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                          />
                        </div>

                        <div className="flex justify-end gap-3 border-t pt-4">
                          <button
                            onClick={() => {
                              setConfirmType(null);
                              setCheckedReasons({
                                fakeInfo: false,
                                badLanguage: false,
                                wrongCategory: false,
                                forbiddenJob: false,
                                other: false,
                              });
                              setOtherReasonText("");
                            }}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleDeleteJob}
                            disabled={
                              isApplying ||
                              !(
                                Object.keys(checkedReasons).some(k => k !== 'other' && checkedReasons[k]) ||
                                (checkedReasons.other && otherReasonText.trim().length > 0)
                              )
                            }
                            className={`px-5 py-2 rounded-lg font-bold text-white transition-all ${!(
                              Object.keys(checkedReasons).some(k => k !== 'other' && checkedReasons[k]) ||
                              (checkedReasons.other && otherReasonText.trim().length > 0)
                            )
                              ? 'bg-red-300 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 shadow-md'
                              }`}
                          >
                            {isApplying ? 'Đang xử lý...' : 'Xác nhận gỡ bài'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal ứng tuyển */}
            {showApplyModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Nộp hồ sơ ứng tuyển</h3>
                    <p className="text-gray-600 mb-4">Vui lòng tải lên CV (định dạng PDF) của bạn để ứng tuyển công việc này.</p>

                    <div className="mb-6">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedCvFile(e.target.files[0])}
                        className="w-full text-gray-700 bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedCvFile && <p className="text-sm text-green-600 mt-2">Đã chọn: {selectedCvFile.name}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowApplyModal(false);
                          setSelectedCvFile(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleApplySubmit}
                        disabled={isApplying || !selectedCvFile}
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                      >
                        {isApplying ? 'Đang gửi...' : 'Nộp CV'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal danh sách CV */}
            {showCvListModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Danh sách ứng viên ({cvList.length})</h3>

                    <div className="mb-4 max-h-64 overflow-y-auto border rounded-lg">
                      <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                          <tr>
                            <th scope="col" className="px-4 py-3">STT</th>
                            <th scope="col" className="px-4 py-3">Họ Tên</th>
                            <th scope="col" className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedCvs.length === cvList.length && cvList.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCvs(cvList.map(cv => cv.user_id));
                                  } else {
                                    setSelectedCvs([]);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cvList.map((cv, idx) => (
                            <tr key={cv.user_id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-900">{idx + 1}</td>
                              <td className="px-4 py-3">{cv.full_name || `Ứng viên #${cv.user_id}`}</td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCvs.includes(cv.user_id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCvs([...selectedCvs, cv.user_id]);
                                    } else {
                                      setSelectedCvs(selectedCvs.filter(id => id !== cv.user_id));
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowCvListModal(false)}
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={handleDownloadSelectedCVs}
                        disabled={isApplying || selectedCvs.length === 0}
                        className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                      >
                        {isApplying ? 'Đang tải...' : `Tải ${selectedCvs.length} CV`}
                      </button>
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
