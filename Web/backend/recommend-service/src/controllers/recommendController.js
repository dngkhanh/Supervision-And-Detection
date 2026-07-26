import Recommend from "../models/recommend.js";
import axios from "axios";
const JOB_SERVICE_URL = "http://job-service:3002/job"

export const getAllRecommends = async (req, res) => {
  const recs = await Recommend.find();
  res.json(recs);
};

export const createRecommend = async (req, res) => {
  const rec = await Recommend.create(req.body);
  res.json(rec);
};

const extractUserId = (decoded) => {
  if (!decoded) return null;

  return (
    decoded.user_id ||
    decoded.id ||
    decoded._id ||
    decoded.user?.user_id ||
    decoded.user?.id ||
    decoded.user?._id ||
    null
  );
};

export const getJobRecommendations = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    // Tận dụng req.user từ middleware checkAuthOrGuest
    const user = req.user; 

    // =========================
    // CASE 1: KHÔNG ĐĂNG NHẬP (Guest)
    // =========================
    if (!user) {
      // Đảm bảo JOB_SERVICE_URL đã được định nghĩa trong file .env hoặc constants
      const response = await axios.get(
        `${JOB_SERVICE_URL}/home`,
        { params: { page } }
      );
      return res.status(200).json(response.data);
    }

    // =========================
    // CASE 2: CÓ ĐĂNG NHẬP (User)
    // =========================
    // Sử dụng user_id từ model User đã lưu trong thông tin đã giải mã
    const userId = user.user_id; 

    let q = "";
    let province = "";
    let viewedJobs = [];

    // Tìm lịch sử dựa trên userId (kiểu Number theo model của bạn)
    const history = await Recommend.findOne({ userId });
    if (history) {
      q = history.last_search || "";
      province = history.area || "";
      viewedJobs = history.viewed_jobs || [];
    }

    const response = await axios.get(
      `${JOB_SERVICE_URL}/search_fill`,
      {
        params: {
          q,
          province,
          page,
          excludeIds: viewedJobs.join(","),
        },
        // Gửi lại chính token từ request gốc nếu cần
        headers: { Authorization: req.headers.authorization },
      }
    );

    const jobsData = response.data;
    const jobs = jobsData.data || [];

    // Cập nhật viewed_jobs
    if (jobs.length > 0) {
      const newJobIds = jobs
        .map(j => j.job_id)
        .filter(id => !viewedJobs.includes(id));

      const updatedViewedJobs = [...viewedJobs, ...newJobIds].slice(-10); // Lấy 10 jobs gần nhất thay vì 6

      await Recommend.updateOne(
        { userId },
        { $set: { viewed_jobs: updatedViewedJobs } },
        { upsert: true }
      );
    }

    return res.status(200).json(jobsData);

  } catch (error) {
    // Log chi tiết lỗi để debug dễ hơn
    console.error("❌ Lỗi API Recommend:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy gợi ý việc làm.",
      error: error.message
    });
  }
};