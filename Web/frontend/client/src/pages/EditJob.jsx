import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";
import { useNavigate, useParams } from 'react-router-dom';

const CATEGORY_LIST = [
  "IT - Phần mềm",
  "Marketing/Truyền thông",
  "Nhân sự/HR",
  "Tài chính/Kế toán",
  "Kinh doanh/Bán hàng",
  "Thiết kế/Design",
  "Khác"
];

const initialState = {
  job_title: "",
  company_name: "",
  closed_date: "",
  experience: "Không yêu cầu kinh nghiệm",
  degree: "",
  description: "",
  requirements: "",
  benefits: "",
  level: "Nhân viên (Fresher/Junior/Senior)",
  work_type: "Toàn thời gian (Full-time)",
  post_user_id: "",
  working_time: "",
  locations: [
    { city: "", district: "", addressDetail: "" }
  ],
  categories: []
};

const EditJob = () => {
  const { id } = useParams();
  const [form, setForm] = useState(initialState);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  // Salary state
  const [salaryType, setSalaryType] = useState("range");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  // Location API state
  const [provinces, setProvinces] = useState([]);
  const [districtsByRow, setDistrictsByRow] = useState({});
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  useEffect(() => {
    // Fetch provinces on mount
    fetch("https://provinces.open-api.vn/api/p/")
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Lỗi fetch tỉnh thành:", err));
  }, []);

  const handleAddLocation = () => {
    if (form.locations.length >= 5) {
      alert("Bạn chỉ được thêm tối đa 5 địa điểm.");
      return;
    }
    setForm(prev => ({
      ...prev,
      locations: [...prev.locations, { city: "", district: "", addressDetail: "" }]
    }));
  };

  const handleRemoveLocation = (index) => {
    if (form.locations.length <= 1) {
      alert("Phải có nhất 1 địa điểm làm việc.");
      return;
    }
    setForm(prev => {
      const updated = prev.locations.filter((_, idx) => idx !== index);
      return { ...prev, locations: updated };
    });
    setDistrictsByRow(prev => {
      const updated = {};
      Object.keys(prev).forEach(key => {
        const k = parseInt(key);
        if (k < index) updated[k] = prev[k];
        else if (k > index) updated[k - 1] = prev[k];
      });
      return updated;
    });
  };

  const handleLocationFieldChange = (index, field, value) => {
    setForm(prev => {
      const updated = prev.locations.map((loc, idx) => {
        if (idx === index) return { ...loc, [field]: value };
        return loc;
      });
      return { ...prev, locations: updated };
    });
  };

  const handleCityChange = async (index, cityName) => {
    if (!cityName) {
      setDistrictsByRow(prev => ({ ...prev, [index]: [] }));
      handleLocationFieldChange(index, "city", "");
      handleLocationFieldChange(index, "district", "");
      return;
    }
    const prov = provinces.find(p => p.name === cityName);
    if (prov) {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${prov.code}?depth=2`);
        const data = await res.json();
        setDistrictsByRow(prev => ({ ...prev, [index]: data.districts || [] }));
        setForm(prev => {
          const updated = prev.locations.map((loc, idx) => {
            if (idx === index) return { ...loc, city: cityName, district: "" };
            return loc;
          });
          return { ...prev, locations: updated };
        });
      } catch (err) {
        console.error("Lỗi fetch quận huyện:", err);
      }
    }
  };

  const handleSelectCategory = (catName) => {
    const selected = form.categories || [];
    if (selected.includes(catName)) {
      setForm(prev => ({
        ...prev,
        categories: selected.filter(c => c !== catName)
      }));
      return;
    }
    if (selected.length >= 3) {
      alert("Chỉ được phép chọn tối đa 3 ngành nghề.");
      return;
    }
    setForm(prev => ({
      ...prev,
      categories: [...selected, catName]
    }));
  };

  useEffect(() => {
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

  useEffect(() => {
    if (id) {
      axiosClient.get(`/job/${id}`)
        .then(async (res) => {
          const job = res.data.data || res.data;
          
          const locs = (job.locations && job.locations.length > 0)
            ? job.locations
            : [{ city: job.province || "", district: job.district || "", addressDetail: job.address || "" }];
          
          const cats = (job.categories && job.categories.length > 0)
            ? job.categories
            : (job.industry ? job.industry.split(", ").filter(Boolean) : []);

          setForm(prev => ({ 
            ...prev, 
            ...job, 
            locations: locs, 
            categories: cats 
          }));

          if (job.company_logo) {
            setExistingLogoUrl(job.company_logo);
            setLogoPreview(job.company_logo);
          }
          if (job.salary) {
            if (job.salary === "Thoả thuận") {
              setSalaryType("negotiable");
            } else {
              setSalaryType("range");
              const match = job.salary.match(/(\d+(?:\.\d+)*)\s*-\s*(\d+(?:\.\d+)*)/);
              if (match) {
                setMinSalary(match[1]);
                setMaxSalary(match[2]);
              }
            }
          }

          // Fetch districts for each loaded city
          if (provinces.length > 0) {
            const fetchDistrictsForLoc = async (loc, idx) => {
              if (loc.city) {
                const prov = provinces.find(p => p.name === loc.city);
                if (prov) {
                  try {
                    const r = await fetch(`https://provinces.open-api.vn/api/p/${prov.code}?depth=2`);
                    const data = await r.json();
                    setDistrictsByRow(prev => ({ ...prev, [idx]: data.districts || [] }));
                  } catch (e) {
                    console.error("Lỗi fetch quận huyện:", e);
                  }
                }
              }
            };
            await Promise.all(locs.map((loc, idx) => fetchDistrictsForLoc(loc, idx)));
          }
        })
        .catch(err => console.error("Lỗi fetch job:", err));
    }
  }, [id, provinces]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "closed_date") {
      if (value && (value < todayStr || value > maxDateStr)) {
        alert("Vui lòng chọn ngày trong khoảng 30 ngày kể từ hôm nay.");
        setForm((f) => ({ ...f, closed_date: "" }));
        return;
      }
    }

    const formatCurrency = (val) => {
      if (!val) return "";
      const raw = val.replace(/\D/g, "");
      if (!raw) return "";
      return Number(raw).toLocaleString("vi-VN");
    };

    if (name === "minSalary") {
      setMinSalary(formatCurrency(value));
      return;
    }

    if (name === "maxSalary") {
      setMaxSalary(formatCurrency(value));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));

    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!form.categories || form.categories.length === 0) {
      setMessage("Vui lòng chọn ít nhất 1 ngành nghề.");
      setLoading(false);
      return;
    }

    const hasEmptyLoc = form.locations.some(l => !l.city || !l.district || !l.addressDetail);
    if (hasEmptyLoc) {
      setMessage("Vui lòng nhập đầy đủ thông tin Tỉnh, Huyện, Địa chỉ cho mọi địa điểm.");
      setLoading(false);
      return;
    }

    // Calculate final salary string
    let finalSalary = "";
    if (salaryType === "negotiable") {
      finalSalary = "Thoả thuận";
    } else {
      const rawMin = minSalary.replace(/\D/g, "");
      const rawMax = maxSalary.replace(/\D/g, "");
      if (!rawMin || !rawMax) {
        setMessage("Vui lòng nhập đầy đủ khoảng lương hoặc chọn thoả thuận.");
        setLoading(false);
        return;
      }
      finalSalary = `${Number(rawMin).toLocaleString('vi-VN')} - ${Number(rawMax).toLocaleString('vi-VN')} VND`;
    }

    try {
      let companyLogoUrl = existingLogoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append("image", logoFile);

        const uploadRes = await axiosClient.post("/user/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (uploadRes.data && uploadRes.data.image_url) {
          companyLogoUrl = uploadRes.data.image_url;
        }
      }

      const payload = {
        job_title: form.job_title,
        company_name: form.company_name,
        closed_date: form.closed_date || undefined,
        salary: finalSalary,
        experience: form.experience,
        degree: form.degree,
        post_user_id: Number(form.post_user_id) || Number(userId),
        description: form.description,
        requirements: form.requirements,
        benefits: form.benefits,
        level: form.level,
        work_type: form.work_type,
        company_logo: companyLogoUrl,
        working_time: form.working_time,
        locations: form.locations,
        categories: form.categories
      };

      const res = await axiosClient.put(`/job/${id}`, payload);
      setMessage("Cập nhật việc thành công!");
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi khi cập nhật việc. Kiểm tra console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 mt-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center">Chỉnh sửa tin tuyển dụng</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* THÔNG TIN CHUNG */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mb-6">
              <h2 className="text-lg font-bold text-blue-800 mb-4">Thông tin chung</h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề công việc</label>
                  <input name="job_title" value={form.job_title} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên công ty</label>
                    <input name="company_name" value={form.company_name} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Logo công ty</label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded border object-cover" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngành nghề/Lĩnh vực (Tối đa 3)</label>
                  <div className="relative">
                    <div
                      onClick={() => setShowCatDropdown(!showCatDropdown)}
                      className="min-h-[48px] w-full border border-gray-300 rounded-xl p-2 flex flex-wrap gap-2 items-center cursor-pointer bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      {(!form.categories || form.categories.length === 0) ? (
                        <span className="text-gray-400 pl-2">-- Chọn ngành nghề --</span>
                      ) : (
                        form.categories.map(cat => (
                          <span key={cat} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold py-1 px-2.5 rounded-full border border-blue-200">
                            {cat}
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleSelectCategory(cat); }} className="text-blue-500 hover:text-blue-800 font-bold">×</button>
                          </span>
                        ))
                      )}
                    </div>
                    {showCatDropdown && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {CATEGORY_LIST.map(cat => (
                          <div
                            key={cat}
                            onClick={() => handleSelectCategory(cat)}
                            className={`p-3 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${form.categories?.includes(cat) ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'}`}
                          >
                            {cat}
                            {form.categories?.includes(cat) && <span className="text-blue-600 font-bold">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cấp bậc</label>
                  <select name="level" value={form.level} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                    <option value="Thực tập sinh (Intern)">Thực tập sinh (Intern)</option>
                    <option value="Nhân viên (Fresher/Junior/Senior)">Nhân viên (Fresher/Junior/Senior)</option>
                    <option value="Trưởng nhóm (Team Leader)">Trưởng nhóm (Team Leader)</option>
                    <option value="Trưởng phòng (Manager)">Trưởng phòng (Manager)</option>
                    <option value="Giám đốc (Director)">Giám đốc (Director)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hình thức làm việc</label>
                  <select name="work_type" value={form.work_type} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white" required>
                    <option value="Toàn thời gian (Full-time)">Toàn thời gian (Full-time)</option>
                    <option value="Bán thời gian (Part-time)">Bán thời gian (Part-time)</option>
                    <option value="Remote (Làm việc từ xa)">Remote (Làm việc từ xa)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ĐỊA ĐIỂM & THỜI GIAN */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Địa điểm & Thời gian</h2>

              <div className="space-y-4 mb-6">
                {form.locations && form.locations.map((loc, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-gray-200 relative">
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs text-gray-500 mb-1">Tỉnh/Thành phố</label>
                      <select
                        value={loc.city}
                        onChange={(e) => handleCityChange(idx, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">-- Chọn Tỉnh/Thành --</option>
                        {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>

                    <div className="w-full md:w-1/4">
                      <label className="block text-xs text-gray-500 mb-1">Quận/Huyện</label>
                      <select
                        value={loc.district}
                        onChange={(e) => handleLocationFieldChange(idx, "district", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 bg-white outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!loc.city}
                      >
                        <option value="">-- Chọn Quận/Huyện --</option>
                        {(districtsByRow[idx] || []).map(d => (
                          <option key={d.code} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Địa chỉ cụ thể văn phòng</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Tòa nhà A, Số 1 Đường B..."
                        value={loc.addressDetail}
                        onChange={(e) => handleLocationFieldChange(idx, "addressDetail", e.target.value)}
                        autoComplete="off"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {form.locations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(idx)}
                        className="text-red-500 hover:text-red-700 p-2 md:self-end mb-1"
                        title="Xóa địa điểm này"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {form.locations && form.locations.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    + Thêm địa điểm khác
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày đóng (Tối đa 30 ngày)</label>
                <input type="date" name="closed_date" value={form.closed_date} min={todayStr} max={maxDateStr} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>

            {/* MỨC LƯƠNG & YÊU CẦU */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Mức lương & Yêu cầu</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Mức lương</label>
                <div className="flex flex-col sm:flex-row gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="salaryType" value="range" checked={salaryType === "range"} onChange={() => setSalaryType("range")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700 font-medium">Nhập khoảng lương</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="salaryType" value="negotiable" checked={salaryType === "negotiable"} onChange={() => setSalaryType("negotiable")} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700 font-medium">Thoả thuận</span>
                  </label>
                </div>

                {salaryType === "range" && (
                  <div className="flex items-center gap-4">
                    <input type="text" name="minSalary" placeholder="Mức thấp nhất (VNĐ)" value={minSalary} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                    <span className="text-gray-500 font-bold">-</span>
                    <input type="text" name="maxSalary" placeholder="Mức cao nhất (VNĐ)" value={maxSalary} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Kinh nghiệm</label>
                  <select name="experience" value={form.experience} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Không yêu cầu kinh nghiệm">Không yêu cầu kinh nghiệm</option>
                    <option value="Dưới 1 năm">Dưới 1 năm</option>
                    <option value="1-2 năm">1-2 năm</option>
                    <option value="2-4 năm">2-4 năm</option>
                    <option value="5 năm trở lên">5 năm trở lên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bằng cấp</label>
                  <input name="degree" value={form.degree} onChange={handleChange} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian làm việc</label>
                  <input
                    name="working_time"
                    value={form.working_time || ""}
                    onChange={handleChange}
                    placeholder="Ví dụ: Từ thứ 2 - thứ 6 (8h- 16h), nghỉ thứ 7, chủ nhật..."
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* CHI TIẾT CÔNG VIỆC */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả công việc</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={5} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yêu cầu công việc</label>
                <textarea name="requirements" value={form.requirements} onChange={handleChange} rows={4} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quyền lợi</label>
                <textarea name="benefits" value={form.benefits} onChange={handleChange} rows={3} className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition disabled:bg-gray-400">
                {loading ? "Đang xử lý..." : "Cập nhật công việc"}
              </button>
              <button type="button" onClick={() => navigate('/my-jobs')} className="px-8 py-3 bg-white border border-gray-300 hover:bg-gray-50 font-bold text-gray-700 rounded-xl transition">
                Hủy
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-4 rounded-xl text-center font-bold text-sm border ${message.includes("thành công") ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;
