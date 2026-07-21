import React from "react";
import { useNavigate } from "react-router-dom";

const JobCard = ({ job = {} }) => {
  const navigate = useNavigate();

  const {
    job_title = "Untitled",
    area = "N/A",
    salary,
    createdAt,
    company = "Công ty",
    company_name,
    experience,
    description,
    job_status, // có thể không tồn tại
  } = job;

  const displayCompany = company_name || company;

  let formattedSalary = "Thỏa thuận";
  if (salary && typeof salary === "string" && salary.trim()) {
    const s = salary.trim();
    const numeric = s.replace(/[\.,]/g, "").match(/^\d+$/);
    formattedSalary = numeric
      ? `${Number(s.replace(/[\.,]/g, "")).toLocaleString()} VND`
      : s;
  }

  const rawStatus =
    job_status ??
    job.status ??
    job.state ??
    (job.is_deleted ? "deleted" : null) ??
    (job.is_waiting ? "waiting" : null);

  const normalizeStatus = (val) => {
    if (!val) return null;
    const s = String(val).toLowerCase().trim();
    const map = {
      available: "available",
      active: "available",
      "còn hạn": "available",
      waiting: "waiting",
      pending: "waiting",
      "chờ duyệt": "waiting",
      outdated: "outdated",
      expired: "outdated",
      "hết hạn": "outdated",
      deleted: "deleted",
      removed: "deleted",
      "đã xóa": "deleted",
      "1": "available",
      "2": "waiting",
      "3": "outdated",
      "4": "deleted",
      true: "deleted",
    };
    return map[s] || null;
  };

  const statusMap = {
    available: { label: "Còn hạn", cls: "bg-emerald-50 text-emerald-700" },
    outdated: { label: "Hết hạn", cls: "bg-rose-50 text-rose-700" },
    waiting: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700" },
    deleted: { label: "Đã xóa", cls: "bg-gray-100 text-gray-600" },
  };

  const status = statusMap[normalizeStatus(rawStatus)] || null;

  return (
    <div
      className="
        relative bg-white rounded-2xl border border-gray-100
        shadow-lg hover:shadow-2xl transition-all
        p-5 h-[360px] flex flex-col
      "
      role="button"
      tabIndex={0}
      onClick={() => {
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("user_id");
        if (!token || !userId) {
          navigate("/login");
          return;
        }
        if (job.job_id) navigate(`/job/${job.job_id}`);
      }}
    >
      {/* ===== HEADER ===== */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
          {displayCompany?.charAt(0)?.toUpperCase() || "C"}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 min-h-[48px]">
            {job_title}
          </h3>
          <p className="text-sm text-gray-600 truncate">{displayCompany}</p>

          <div className="mt-2 flex flex-wrap gap-2 min-h-[32px]">
            {area && (
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                📍 {area}
              </span>
            )}
            {formattedSalary && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                💸 {formattedSalary}
              </span>
            )}
            {experience && (
              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                🎯 {experience}
              </span>
            )}
            {status && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.cls}`}
              >
                📢 {status.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== DESCRIPTION ===== */}
      <div className="flex-1 overflow-hidden mt-4">
        <p className="text-sm text-gray-700 line-clamp-3 min-h-[60px]">
          {description || "Mô tả đang cập nhật."}
        </p>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="mt-auto flex justify-end pt-4">
        <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition">
          Xem chi tiết
        </button>
      </div>

      {/* ===== CARD BORDER RING ===== */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-gray-200/70" />
    </div>
  );
};

export default JobCard;
