import React, { useEffect, useState, useRef } from "react";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import JobCard from "../components/JobCard";

// ===== GIỮ NGUYÊN API =====
const API_POSTED = "/job/job/posted";
const API_APPLIED = "/application/application/all-applied";

const MyJobs = () => {
  const [postedJobs, setPostedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [loadingPosted, setLoadingPosted] = useState(false);
  const [loadingApplied, setLoadingApplied] = useState(false);

  const [errorPosted, setErrorPosted] = useState("");
  const [errorApplied, setErrorApplied] = useState("");

  const appliedRef = useRef(null);
  const postedRef = useRef(null);
  const navigate = useNavigate();

  // ===== LĂN CHUỘT DỌC -> CUỘN NGANG =====
  const attachHorizontalWheel = (el) => {
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  };

  const loadPostedJobs = async () => {
    setLoadingPosted(true);
    setErrorPosted("");
    try {
      const res = await axiosClient.get(API_POSTED);
      const list =
        res.data?.data ??
        res.data?.items ??
        (Array.isArray(res.data) ? res.data : []);
      setPostedJobs(list);
    } catch (err) {
      console.error("Load posted jobs error:", err);
      setErrorPosted("Không thể tải danh sách công việc đã đăng.");
    } finally {
      setLoadingPosted(false);
    }
  };

  const loadAppliedJobs = async () => {
    setLoadingApplied(true);
    setErrorApplied("");
    try {
      const res = await axiosClient.get(API_APPLIED);
      const list =
        res.data?.data ??
        res.data?.items ??
        (Array.isArray(res.data) ? res.data : []);
      setAppliedJobs(list);
    } catch (err) {
      console.error("Load applied jobs error:", err);
      setErrorApplied("Không thể tải danh sách công việc đã ứng tuyển.");
    } finally {
      setLoadingApplied(false);
    }
  };

  useEffect(() => {
    loadPostedJobs();
    loadAppliedJobs();
  }, []);

  useEffect(() => {
    const cleanup1 = attachHorizontalWheel(appliedRef.current);
    const cleanup2 = attachHorizontalWheel(postedRef.current);
    return () => {
      cleanup1 && cleanup1();
      cleanup2 && cleanup2();
    };
  }, []);

  const goDetail = (job) => {
    const id = job.id || job.job_id || job._id;
    if (!id) return;
    navigate(`/jobs/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Công việc của tôi</h1>

        {/* ===== CÔNG VIỆC ĐÃ ỨNG TUYỂN ===== */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">
            Công việc đã ứng tuyển
          </h2>

          {loadingApplied && <p>Đang tải...</p>}
          {errorApplied && <p className="text-red-600">{errorApplied}</p>}
          {!loadingApplied && !errorApplied && appliedJobs.length === 0 && (
            <p className="text-gray-500">Bạn chưa ứng tuyển công việc nào.</p>
          )}

          <div
            ref={appliedRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-3 snap-x snap-mandatory"
          >
            {appliedJobs.map((job) => (
              <div
                key={job.id || job.job_id || job._id}
                className="snap-start"
                style={{ width: 300, minWidth: 300 }}
              >
                <JobCard job={job} onClick={() => goDetail(job)} />
              </div>
            ))}
          </div>
        </section>

        {/* ===== CÔNG VIỆC ĐÃ ĐĂNG ===== */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Công việc đã đăng
          </h2>

          {loadingPosted && <p>Đang tải...</p>}
          {errorPosted && <p className="text-red-600">{errorPosted}</p>}
          {!loadingPosted && !errorPosted && postedJobs.length === 0 && (
            <p className="text-gray-500">Bạn chưa đăng công việc nào.</p>
          )}

          <div
            ref={postedRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar py-3 snap-x snap-mandatory"
          >
            {postedJobs.map((job) => (
              <div
                key={job.id || job.job_id || job._id}
                className="snap-start"
                style={{ width: 300, minWidth: 300 }}
              >
                <JobCard job={job} onClick={() => goDetail(job)} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyJobs;
