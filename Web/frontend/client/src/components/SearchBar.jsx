import React, { useState } from "react";

const SearchBar = ({ onSubmit }) => {
  const [keyword, setKeyword] = useState("");
  const [province, setProvince] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const userId = localStorage.getItem("user_id") || ""; // thêm user_id
      await onSubmit({
        q: keyword.trim(),
        province: province.trim(),
        token,
        userId,
      });
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
      <input
        className="flex-1 px-6 py-4 rounded-lg border-2 border-transparent outline-none focus:border-blue-400 transition-all shadow-xl bg-white/95"
        placeholder="Nhập tên công việc"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <input
        className="w-64 px-5 py-4 rounded-lg border-2 border-transparent outline-none focus:border-blue-400 transition-all shadow-xl bg-white/95"
        placeholder="Tỉnh/thành"
        value={province}
        onChange={(e) => setProvince(e.target.value)}
      />
      <button
        type="submit"
        className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-lg hover:bg-yellow-400 transition-all duration-200 font-bold shadow-xl hover:shadow-2xl disabled:opacity-60"
        disabled={localLoading}
      >
        {localLoading ? "Đang tìm..." : "🔍 Tìm kiếm"}
      </button>
    </form>
  );
};

const handleSearchSubmit = async ({ q, province, token }) => {
  setSearchQ(q?.trim() || "");
  setSearchProvince(province?.trim() || "");
  setPage(1);

  // ví dụ fetchSearchPage(1) dùng header Authorization
  await fetchSearchPage(1, token);
};

const fetchSearchPage = async (nextPage = 1, token) => {
  setLoading(true);
  try {
    const res = await axiosClient.get("/job/job/search", {
      params: { q: searchQ || undefined, province: searchProvince || undefined, page: nextPage, limit: 6 },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    // ...existing code...
  } finally {
    setLoading(false);
  }
};

export default SearchBar;