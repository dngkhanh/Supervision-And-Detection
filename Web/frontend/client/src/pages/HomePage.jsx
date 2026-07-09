import React, { useState, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";
import JobCard from "../components/JobCard";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import { useLocation } from "react-router-dom";

const HomePage = () => {
  const location = useLocation();
  const [welcome, setWelcome] = useState("");

  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchProvince, setSearchProvince] = useState("");

  const listRef = useRef(null);

  useEffect(() => {
    // Lần đầu: load mặc định trang 1
    setIsSearching(false);
    setPage(1);
  }, []);

  // Mỗi lần page hoặc chế độ thay đổi -> fetch
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token") || "";
        if (isSearching) {
          const res = await axiosClient.get("/job/job/search", {
            params: { q: searchQ || undefined, province: searchProvince || undefined, page, limit: 6, ts: Date.now() },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const json = res.data;
          setJobs(json.data || []);
          setTotalPages(json.totalPages || 1);
        } else {
          const token = localStorage.getItem("access_token") || "";
          const userId = localStorage.getItem("user_id") || null;

          const res = await axiosClient.get("/recommend/recommend/recommend", {
            params: {
              page,
              limit: 6,
              ts: Date.now(),
            },
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : undefined,
                  });
          const json = res.data;
          setJobs(json.data || []);
          setTotalPages(json.totalPages || 1);
        }
        if (listRef.current) {
          listRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch (e) {
        console.error("Fetch jobs failed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page, isSearching, searchQ, searchProvince]);

  // Nhận submit từ SearchBar
  const handleSearchSubmit = async ({ q, province, token, userId }) => {
    setIsSearching(true);
    setSearchQ(q || "");
    setSearchProvince(province || "");
    setPage(1);

    // Gọi fetch với tham số vừa nhập, không dùng state (tránh phải bấm 2 lần)
    await fetchSearchPage(1, token, userId, q, province);
  };

  const fetchSearchPage = async (nextPage = 1, token, userId, qOverride, provinceOverride) => {
    setLoading(true);
    try {
      const q = (qOverride ?? searchQ) || undefined;
      const province = (provinceOverride ?? searchProvince) || undefined;

      const res = await axiosClient.get("/job/job/search", {
        params: {
          q,
          province,
          page: nextPage,
          limit: 6,
          userId: userId || undefined,
          ts: Date.now(),
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = res.data;
      setJobs(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (e) {
      console.error("Fetch jobs failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    setPage((p) => Math.max(p - 1, 1));
  };
  const goNext = () => {
    setPage((p) => Math.min(p + 1, totalPages));
  };

  useEffect(() => {
    const name = location.state?.welcomeUserName;
    if (name) {
      setWelcome(`Chào mừng, ${name}!`);
      const t = setTimeout(() => setWelcome(''), 5000);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ===== NAVBAR ===== */}
      <Navbar />
      {/* ===== SEARCH WITH BACKGROUND IMAGE ===== */}
      <div className="relative py-24 overflow-hidden">
        {/* Overlay để làm tối hình nền */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-700/80"></div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <h1 className="text-white text-5xl font-extrabold text-center mb-3">
            Tìm Công Việc Mơ Ước Của Bạn
          </h1>
          <p className="text-blue-100 text-center mb-8 text-lg">
            Hàng nghìn cơ hội việc làm đang chờ đón bạn
          </p>
          <SearchBar onSubmit={handleSearchSubmit} />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* ===== JOB SECTION ===== */}
      <div className="max-w-6xl mx-auto px-4 mt-10 pb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Việc làm hấp dẫn</h2>
          
        </div>

        {/* ===== JOB LIST ===== */}
        <div
          ref={listRef}
          className="max-w-6xl mx-auto px-4 py-8"
        >
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <>
              {jobs.length === 0 ? (
                <p>Không có kết quả.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <li key={job._id || job.job_id}>
                      <JobCard job={job} />
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={goPrev}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  ← Trang trước
                </button>
                <span>
                  Trang {page} / {totalPages} {isSearching}
                </span>
                <button
                  onClick={goNext}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Trang sau →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {welcome && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
          {welcome}
        </div>
      )}
    </div>
  );
};

export default HomePage;