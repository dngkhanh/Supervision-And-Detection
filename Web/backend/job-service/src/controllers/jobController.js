import mongoose from "mongoose";
import Job from "../models/job.js";
import { publishRecommendSearch } from "../config/rabbitconfig.js";
// dùng rabbitconfig có sẵn

export const getAllJobs = async (req, res) => {
  const jobs = await Job.find({ status: 'available' });
  res.json(jobs);
};

export const createJob = async (req, res) => {
  try {
    // Lấy job_id tiếp theo
    const last = await Job.findOne().sort({ job_id: -1 }).select("job_id");
    const nextId = last && last.job_id ? last.job_id + 1 : 1;

    // Lấy user_id từ middleware verifyToken
    const postUserId = req.user?.user_id || req.user?.id || req.user?._id;

    if (!postUserId) {
      return res.status(401).json({ message: "Unauthorized: missing user_id" });
    }

    const categories = req.body.categories || [];
    const locations = req.body.locations || [];

    const computedProvince = locations[0]?.city || req.body.province || "";
    const computedDistrict = locations[0]?.district || req.body.district || "";
    const computedAddress = locations[0]?.addressDetail || req.body.address || "";
    const computedArea = locations.length > 0
      ? locations.map(l => `${l.addressDetail}, ${l.district}, ${l.city}`).join("; ")
      : req.body.area || "";

    const computedIndustry = categories.length > 0
      ? categories.join(", ")
      : req.body.industry || "";

    // CHỈ lấy các field có trong model
    const job = await Job.create({
      job_id: nextId,
      job_title: req.body.job_title,
      company_name: req.body.company_name,
      closed_date: req.body.closed_date,
      salary: req.body.salary,
      experience: req.body.experience,
      degree: req.body.degree,
      description: req.body.description,
      requirements: req.body.requirements,
      benefits: req.body.benefits,
      level: req.body.level,
      work_type: req.body.work_type,
      company_logo: req.body.company_logo,
      working_time: req.body.working_time,
      
      locations: locations,
      categories: categories,

      province: computedProvince,
      district: computedDistrict,
      address: computedAddress,
      area: computedArea,
      industry: computedIndustry,

      post_user_id: postUserId,
      status: "waiting"
    });
    console.log("Create job response:", job);

    // Gửi thông báo đến toàn bộ Admin để duyệt tin
    try {
      await fetch("http://user-service:3001/user/notification/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify({
          message: `Công việc "${job.job_title}" từ công ty "${job.company_name}" đã được đăng tải và đang chờ duyệt.`
        })
      });
      console.log("Đã gửi thông báo chờ duyệt tin đến các Admin");
    } catch (notifErr) {
      console.error("Lỗi khi gửi thông báo bài đăng mới tới các Admin:", notifErr.message);
    }

    res.status(201).json(job);
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ message: "Create job failed" });
  }
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

export const searchJobs = async (req, res) => {
  try {
    const { q = "", province = "", excludeIds = "" } = req.query;

    // =========================
    // Pagination
    // =========================
    const DEFAULT_LIMIT = 6;
    const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit || DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, 1);
    const skip = (page - 1) * limit;

    const hasQ = typeof q === "string" && q.trim().length > 0;
    const hasProvince = typeof province === "string" && province.trim().length > 0;

    const excludeJobIds = excludeIds
      ? excludeIds.split(",").map(id => Number(id)).filter(Boolean)
      : [];

    // =========================
    // Query
    // =========================
    const baseFilter = {
      status: { $in: ["available"] },
      ...(excludeJobIds.length > 0 && { job_id: { $nin: excludeJobIds } })
    };

    let query = { ...baseFilter };

    if (hasQ && hasProvince) {
      const regexQ = { $regex: q.trim(), $options: "i" };
      const regexProvince = { $regex: province.trim(), $options: "i" };
      query = {
        ...baseFilter,
        $and: [
          { $or: [{ job_title: regexQ }, { company_name: regexQ }] },
          { area: regexProvince },
        ],
      };
    } else if (hasQ) {
      const regexQ = { $regex: q.trim(), $options: "i" };
      query = {
        ...baseFilter,
        $or: [{ job_title: regexQ }, { company_name: regexQ }, { area: regexQ }],
      };
    } else if (hasProvince) {
      const regexProvince = { $regex: province.trim(), $options: "i" };
      query = { ...baseFilter, area: regexProvince };
    }

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ job_id: -1 })
      .skip(skip)
      .limit(limit);

    // =========================
    // Publish search event
    // =========================
    const userId = extractUserId(req.user);

    if (userId && (hasQ || hasProvince)) {
      const payload = {
        userId,
        q: q || null,
        province: province || null,
        type: "search",
        source: "job-service",
        timestamp: new Date().toISOString(),
      };

      publishRecommendSearch(payload).catch((err) =>
        console.warn("[searchJobs] publish error:", err?.message || err)
      );
    }

    res.json({
      currentPage: page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      totalJobs: total,
      count: jobs.length,
      data: jobs,
    });

  } catch (err) {
    console.error("[searchJobs] error:", err);
    res.status(500).json({
      message: "Search failed",
      error: err.message,
    });
  }
};

// Ví dụ: import Job model (tùy thuộc vào cấu trúc dự án của bạn)
// import Job from '../models/Job.js'; 

// --- PHẦN LOGIC QUẢN LÝ TRẠNG THÁI ---

// Khai báo một mảng để lưu trữ các Job ID đã được lấy ngẫu nhiên.
// Biến này sẽ giữ trạng thái giữa các request.
let fetchedJobIds = [];

// Số lượng ID tối đa trước khi reset danh sách (ví dụ: 10)
const MAX_FETCHED_IDS = 10;

// --- PHẦN CONTROLLERS ---

/**
 * @route GET /api/jobs/random
 * @desc Lấy ngẫu nhiên 5 Job, loại trừ các Job đã được lấy gần đây.
 * @access Public
 */
export const getRandomJobs = async (req, res) => {
  try {

    // 1. Kiểm tra và Reset danh sách ID đã lấy
    if (fetchedJobIds.length >= MAX_FETCHED_IDS) {
      console.log("Danh sách fetchedJobIds đã đạt giới hạn. Resetting...");
      fetchedJobIds = []; // Xóa hết các ID đã lưu
    }

    // 2. Định nghĩa điều kiện tìm kiếm: Loại trừ các Job có ID nằm trong fetchedJobIds
    // Sử dụng _id của MongoDB (thường là ObjectId)
    const matchCondition = fetchedJobIds.length > 0
      ? { '_id': { $nin: fetchedJobIds } } // Loại trừ các ID đã lưu
      : {}; // Nếu chưa có ID nào, không có điều kiện loại trừ

    let jobs = [];

    // 3. Sử dụng Aggregate: Match (loại trừ) trước, sau đó Sample (lấy ngẫu nhiên)
    jobs = await Job.aggregate([
      { $match: matchCondition }, // Lọc bỏ các Job đã lấy
      { $sample: { size: 5 } } // Lấy ngẫu nhiên 5 Job còn lại
    ]);

    // 4. Xử lý trường hợp không đủ Jobs sau khi lọc
    // Nếu số lượng Job lấy được ít hơn 5 VÀ ta đã có danh sách lọc
    if (jobs.length < 5 && fetchedJobIds.length > 0) {
      console.log(`Chỉ lấy được ${jobs.length} Jobs sau khi lọc. Reset fetchedJobIds và thử lại.`);

      fetchedJobIds = []; // Reset để có thể lấy lại

      // Thử lại lần 2 (lấy ngẫu nhiên 5 Job từ tất cả các Job)
      jobs = await Job.aggregate([
        { $sample: { size: 5 } }
      ]);
    }

    // 5. Lưu các ID của các Job vừa lấy vào mảng fetchedJobIds
    const newIds = jobs.map(job => job.id);

    // Thêm các ID mới, đảm bảo tổng số không vượt quá giới hạn
    newIds.forEach(id => {
      // Chỉ thêm nếu tổng số ID hiện tại nhỏ hơn giới hạn
      if (fetchedJobIds.length < MAX_FETCHED_IDS) {
        fetchedJobIds.push(id);
      }
    });

    // 6. Trả về kết quả
    res.status(200).json({
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    console.error("Lỗi Get Random Jobs:", error);
    res.status(500).json({ message: "Lỗi Server", error: error.message });
  }
};


/**
 * @route GET /api/jobs/:id
 * @desc Lấy Job theo ID
 * @access Public
 */

export const getJobById = async (req, res) => {
  try {
    // 1. Lấy Job ID từ request parameters (ví dụ: /api/jobs/65615d18d0f...)
    const jobId = req.params.id;

    // 2. Kiểm tra tính hợp lệ của ID (tùy chọn nhưng nên có)
    // if (!mongoose.Types.ObjectId.isValid(jobId)) { 
    //   return res.status(400).json({ message: "Job ID không hợp lệ" });
    // }

    // 3. Tìm kiếm Job trong database bằng ID (chấp nhận cả job_id số hoặc _id ObjectId để tăng độ tương thích)
    let job;
    if (mongoose.Types.ObjectId.isValid(jobId)) {
      job = await Job.findOne({ $or: [{ _id: jobId }, { job_id: jobId }] });
    } else {
      job = await Job.findOne({ job_id: jobId });
    }

    // 4. Xử lý trường hợp không tìm thấy Job
    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy công việc (Job) này" });
    }

    // 5. Trả về Job tìm được
    res.status(200).json(job);

  } catch (error) {
    console.error(`Lỗi Get Job by ID (${req.params.id}):`, error);
    // Xử lý các lỗi liên quan đến DB hoặc Server
    res.status(500).json({ message: "Lỗi Server khi tìm kiếm Job", error: error.message });
  }
};

export const getJobsPagination = async (req, res) => {
  try {
    const DEFAULT_LIMIT = 6;

    const pageQuery = req.query.page;
    const limitQuery = req.query.limit;

    let page = 1;
    if (pageQuery) {
      const parsedPage = parseInt(pageQuery, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }

    let limit = DEFAULT_LIMIT;
    if (limitQuery) {
      const parsedLimit = parseInt(limitQuery, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    // 🔥 Tổng số job
    const filter = { status: 'available' };
    const totalJobs = await Job.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limit) || 1;

    // Use stable skip/limit pagination so pages don't shift when new jobs are added
    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .sort({ job_id: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    // If requesting a page beyond available pages, return empty data with metadata
    if (jobs.length === 0 && page > totalPages) {
      return res.status(200).json({
        currentPage: page,
        totalPages,
        totalJobs,
        count: 0,
        data: [],
        message: "Đã hết Job trong database."
      });
    }

    res.status(200).json({
      currentPage: page,
      totalPages,
      totalJobs,
      count: jobs.length,
      startJobId: jobs.length > 0 ? jobs[jobs.length - 1].job_id : null,
      endJobId: jobs.length > 0 ? jobs[0].job_id : null,
      data: jobs
    });

  } catch (error) {
    console.error("Lỗi Get Jobs Pagination:", error);
    res.status(500).json({
      message: "Lỗi Server",
      error: error.message
    });
  }
};
/**
 * @route GET /api/jobs/home
 * @desc Lấy tất cả các Job có trạng thái 'available' hoặc 'outdated'.
 * @access Public
 */
/**
 * @route GET /api/jobs/home/pagination
 * @desc Lấy danh sách Job (available/outdated) có phân trang. Mặc định 6 jobs/trang.
 * @access Public
 */
export const getJobsForHomePagination = async (req, res) => {
  try {
    const DEFAULT_LIMIT = 6;

    // 1. Lấy và Xử lý tham số phân trang
    const pageQuery = req.query.page;
    const limitQuery = req.query.limit;

    let page = 1;
    if (pageQuery) {
      const parsedPage = parseInt(pageQuery, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }

    let limit = DEFAULT_LIMIT;
    if (limitQuery) {
      const parsedLimit = parseInt(limitQuery, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    // 2. Định nghĩa Điều kiện Lọc (Giữ nguyên logic 'available' và 'outdated')
    const filterCondition = {
      status: { $in: ['available'] }
    };

    // 3. Tính toán Metadata (Tổng số Job thỏa mãn điều kiện)
    // 🔥 Tổng số job có status là 'available' hoặc 'outdated'
    const totalFilteredJobs = await Job.countDocuments(filterCondition);
    const totalPages = Math.ceil(totalFilteredJobs / limit) || 1;

    // Use stable skip/limit pagination
    const skip = (page - 1) * limit;

    // 4. Truy vấn Database (Tìm kiếm, Sắp xếp, Bỏ qua, Giới hạn)
    const jobs = await Job.find(filterCondition) // Áp dụng điều kiện lọc
      .sort({ job_id: -1 }) // Job mới nhất lên đầu
      .skip(skip)
      .limit(limit);

    // 5. Xử lý trường hợp hết trang
    if (jobs.length === 0 && page > totalPages) {
      return res.status(200).json({
        currentPage: page,
        totalPages,
        totalJobs: totalFilteredJobs,
        count: 0,
        data: [],
        message: "Đã hết Job có trạng thái 'available' hoặc 'outdated'."
      });
    }

    // 6. Trả về kết quả
    res.status(200).json({
      currentPage: page,
      totalPages,
      totalJobs: totalFilteredJobs,
      count: jobs.length,
      startJobId: jobs.length > 0 ? jobs[jobs.length - 1].job_id : null,
      endJobId: jobs.length > 0 ? jobs[0].job_id : null,
      data: jobs
    });

  } catch (error) {
    console.error("Lỗi Get Jobs For Home Pagination:", error);
    res.status(500).json({
      message: "Lỗi Server",
      error: error.message
    });
  }
};

export const search_fill = async (req, res) => {
  try {
    const { q = "", province = "", excludeIds = "" } = req.query;

    const DEFAULT_LIMIT = 6;
    const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit || DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, 1);
    const skip = (page - 1) * limit;

    const hasQ = typeof q === "string" && q.trim().length > 0;
    const hasProvince = typeof province === "string" && province.trim().length > 0;

    const excludeJobIds = excludeIds
      ? excludeIds.split(",").map(Number).filter(Boolean)
      : [];

    // =========================
    // Base filter (giống 2 hàm cũ)
    // =========================
    const baseFilter = {
      status: { $in: ["available"] },
      ...(excludeJobIds.length > 0 && { job_id: { $nin: excludeJobIds } }),
    };

    // =========================
    // 1. Query JOB MATCH SEARCH
    // =========================
    let searchQuery = null;

    if (hasQ || hasProvince) {
      const conditions = [];

      if (hasQ) {
        const regexQ = { $regex: q.trim(), $options: "i" };
        conditions.push({
          $or: [
            { job_title: regexQ },
            { company_name: regexQ },
            { area: regexQ },
          ],
        });
      }

      if (hasProvince) {
        const regexProvince = { $regex: province.trim(), $options: "i" };
        conditions.push({ area: regexProvince });
      }

      searchQuery = {
        ...baseFilter,
        $and: conditions,
      };
    }

    const matchedJobs = searchQuery
      ? await Job.find(searchQuery).sort({ job_id: -1 })
      : [];

    const matchedIds = matchedJobs.map(j => j.job_id);

    // =========================
    // 2. Fill JOB KHÔNG MATCH
    // =========================
    const remainingJobs = await Job.find({
      ...baseFilter,
      ...(matchedIds.length > 0 && { job_id: { $nin: matchedIds } }),
    }).sort({ job_id: -1 });

    // =========================
    // 3. Merge + Pagination
    // =========================
    const mergedJobs = [...matchedJobs, ...remainingJobs];
    const total = mergedJobs.length;
    const paginatedJobs = mergedJobs.slice(skip, skip + limit);

    // =========================
    // 4. Publish search event (giống searchJobs)
    // =========================
    const userId = extractUserId(req.user);
    if (userId && (hasQ || hasProvince)) {
      publishRecommendSearch({
        userId,
        q: q || null,
        province: province || null,
        type: "search_fill",
        source: "job-service",
        timestamp: new Date().toISOString(),
      }).catch(() => { });
    }

    // =========================
    // 5. Response
    // =========================
    res.json({
      currentPage: page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      totalJobs: total,
      count: paginatedJobs.length,
      data: paginatedJobs,
    });

  } catch (err) {
    console.error("[search_fill] error:", err);
    res.status(500).json({
      message: "Search fill failed",
      error: err.message,
    });
  }
};

export const getPostedJob = async (req, res) => {
  try {
    // 1. Lấy user_id từ query hoặc token (verifyToken đã gán req.user)
    const user_id = req.query.userId || req.user?.user_id || req.user?.id || req.user?._id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    const queryUserId = isNaN(user_id) ? user_id : Number(user_id);

    // 2. Lấy các job do user này đăng
    const jobs = await Job.find({ post_user_id: queryUserId })
      .sort({ createdAt: -1 }); // job mới nhất lên trước (nếu có timestamps)

    // 3. Trả kết quả
    return res.status(200).json({
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    console.error("Get Posted Job Error:", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

export const getWaitingJobs = async (req, res) => {
  try {
    const DEFAULT_LIMIT = 6;

    // 1. Lấy và Xử lý tham số phân trang
    const pageQuery = req.query.page;
    const limitQuery = req.query.limit;

    let page = 1;
    if (pageQuery) {
      const parsedPage = parseInt(pageQuery, 10);
      if (!isNaN(parsedPage) && parsedPage > 0) {
        page = parsedPage;
      }
    }

    let limit = DEFAULT_LIMIT;
    if (limitQuery) {
      const parsedLimit = parseInt(limitQuery, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    // 2. Định nghĩa Điều kiện Lọc (Chỉ lấy các job đang chờ duyệt)
    const filterCondition = {
      status: 'waiting' // Hoặc { $in: ['waiting'] } nếu bạn muốn linh hoạt sau này
    };

    // 3. Tính toán Metadata
    const totalWaitingJobs = await Job.countDocuments(filterCondition);
    const totalPages = Math.ceil(totalWaitingJobs / limit) || 1;

    // Tính số bản ghi cần bỏ qua
    const skip = (page - 1) * limit;

    // 4. Truy vấn Database
    const jobs = await Job.find(filterCondition)
      .sort({ job_id: -1 }) // Job mới gửi duyệt lên đầu
      .skip(skip)
      .limit(limit);

    // 5. Xử lý trường hợp không có job hoặc hết trang
    if (jobs.length === 0) {
      return res.status(200).json({
        currentPage: page,
        totalPages,
        totalJobs: totalWaitingJobs,
        count: 0,
        data: [],
        message: "Không có công việc nào đang chờ duyệt."
      });
    }

    // 6. Trả về kết quả
    res.status(200).json({
      currentPage: page,
      totalPages,
      totalJobs: totalWaitingJobs,
      count: jobs.length,
      // Metadata về ID để tiện theo dõi
      startJobId: jobs[jobs.length - 1].job_id,
      endJobId: jobs[0].job_id,
      data: jobs
    });

  } catch (error) {
    console.error("Lỗi Find Waiting Jobs:", error);
    res.status(500).json({
      message: "Lỗi Server khi tìm kiếm công việc chờ duyệt",
      error: error.message
    });
  }
};

export const acceptJob = async (req, res) => {
  try {
    // 1. Lấy job_id từ body
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: "Vui lòng cung cấp job_id" });
    }

    // 2. Tìm job và kiểm tra trạng thái hiện tại
    const job = await Job.findOne({ job_id: job_id });

    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy công việc này" });
    }

    // 3. Kiểm tra nếu job KHÔNG PHẢI đang ở trạng thái waiting
    if (job.status !== 'waiting') {
      return res.status(400).json({
        message: `Không thể duyệt! Trạng thái hiện tại là '${job.status}', không phải 'waiting'.`
      });
    }

    // 4. Cập nhật trạng thái thành available
    job.status = 'available';
    await job.save();

    // 5. Gửi thông báo đến nhà tuyển dụng
    try {
      await fetch("http://user-service:3001/user/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify({
          user_id: job.post_user_id,
          message: `Bài đăng "${job.job_title}" của bạn đã được phê duyệt.`
        })
      });
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo duyệt bài:", notifErr.message);
    }

    // 6. Trả về thông báo thành công
    res.status(200).json({
      message: "Duyệt công việc thành công!",
      data: job
    });

  } catch (error) {
    console.error("Lỗi khi duyệt Job:", error);
    res.status(500).json({
      message: "Lỗi Server khi thực hiện duyệt công việc",
      error: error.message
    });
  }
};

export const refuseJob = async (req, res) => {
  try {
    // 1. Lấy job_id và lý do từ body
    const { job_id, reason } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: "Vui lòng cung cấp job_id" });
    }

    // 2. Tìm job
    const job = await Job.findOne({ job_id: job_id });

    if (!job) {
      return res.status(404).json({ message: "Không tìm thấy công việc này" });
    }

    // 3. Kiểm tra trạng thái: Admin có quyền từ chối/xóa tin waiting, available, expired, outdated và hidden
    if (job.status === 'deleted') {
      return res.status(400).json({
        message: `Không thể gỡ bỏ! Công việc này đã bị xóa trước đó.`
      });
    }

    // 4. Thực hiện xóa cứng bài viết khỏi database
    await Job.deleteOne({ job_id: job_id });

    // 5. Gửi thông báo đến nhà tuyển dụng kèm lý do
    try {
      await fetch("http://user-service:3001/user/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify({
          user_id: job.post_user_id,
          message: `Bài đăng "${job.job_title}" của bạn đã bị xóa. Lý do: ${reason || 'Nội dung không phù hợp.'}`
        })
      });
    } catch (notifErr) {
      console.error("Lỗi gửi thông báo từ chối bài:", notifErr.message);
    }

    // 6. Trả về thông báo thành công
    res.status(200).json({
      message: "Từ chối/Gỡ công việc thành công!",
      data: job
    });

  } catch (error) {
    console.error("Lỗi khi từ chối Job:", error);
    res.status(500).json({
      message: "Lỗi Server khi thực hiện từ chối công việc",
      error: error.message
    });
  }
};

// ==========================================
// QUẢN LÝ CÔNG VIỆC BỞI NGƯỜI DÙNG (UC-04)
// ==========================================

// Xóa tạm thời công việc (Soft-Delete)
export const softDeleteJob = async (req, res) => {
  try {
    const { id } = req.params; // job_id
    const user_id = req.user?.user_id || req.user?.id || req.user?._id;

    if (!user_id) return res.status(401).json({ message: "Chưa đăng nhập" });

    const job = await Job.findOne({ job_id: id });
    if (!job) return res.status(404).json({ message: "Không tìm thấy công việc" });

    if (String(job.post_user_id) !== String(user_id)) {
      return res.status(403).json({ message: "Không có quyền xóa bài đăng này" });
    }

    job.status = 'deleted';
    await job.save();

    res.status(200).json({ message: "Đã xóa công việc thành công (tạm ẩn)", data: job });
  } catch (error) {
    console.error("Soft delete job error:", error);
    res.status(500).json({ message: "Lỗi server khi xóa công việc", error: error.message });
  }
};

// Khôi phục công việc đã ẩn
export const restoreJob = async (req, res) => {
  try {
    const { id } = req.params; // job_id
    const user_id = req.user?.user_id || req.user?.id || req.user?._id;

    if (!user_id) return res.status(401).json({ message: "Chưa đăng nhập" });

    const job = await Job.findOne({ job_id: id });
    if (!job) return res.status(404).json({ message: "Không tìm thấy công việc" });

    if (String(job.post_user_id) !== String(user_id)) {
      return res.status(403).json({ message: "Không có quyền khôi phục bài đăng này" });
    }

    job.status = 'available'; // Theo yêu cầu, khôi phục thì thành active/available luôn
    await job.save();

    res.status(200).json({ message: "Đã khôi phục công việc thành công", data: job });
  } catch (error) {
    console.error("Restore job error:", error);
    res.status(500).json({ message: "Lỗi server khi khôi phục công việc", error: error.message });
  }
};

// Cập nhật công việc
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params; // job_id
    const user_id = req.user?.user_id || req.user?.id || req.user?._id;

    if (!user_id) return res.status(401).json({ message: "Chưa đăng nhập" });

    const job = await Job.findOne({ job_id: id });
    if (!job) return res.status(404).json({ message: "Không tìm thấy công việc" });

    if (String(job.post_user_id) !== String(user_id)) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa bài đăng này" });
    }

    // Cập nhật các trường
    const updatableFields = [
      'job_title', 'company_name', 'closed_date', 'salary',
      'experience', 'degree', 'description', 'requirements', 'benefits',
      'level', 'work_type', 'company_logo', 'working_time',
      'locations', 'categories'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    if (req.body.locations !== undefined) {
      const locs = req.body.locations || [];
      job.province = locs[0]?.city || "";
      job.district = locs[0]?.district || "";
      job.address = locs[0]?.addressDetail || "";
      job.area = locs.map(l => `${l.addressDetail}, ${l.district}, ${l.city}`).join("; ");
    }
    if (req.body.categories !== undefined) {
      const cats = req.body.categories || [];
      job.industry = cats.join(", ");
    }

    await job.save();

    res.status(200).json({ message: "Cập nhật công việc thành công", data: job });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật công việc", error: error.message });
  }
};

export const getAdminJobStats = async (req, res) => {
  try {
    const today = new Date();

    // 1. Tổng số lượng công việc còn thời hạn ứng tuyển
    const activeJobs = await Job.countDocuments({
      status: "available",
      closed_date: { $gte: today }
    });

    // 2. Tổng số lượng công việc đã hết hạn
    const expiredJobs = await Job.countDocuments({
      $or: [
        { status: "expired" },
        { status: "outdated" },
        { status: "available", closed_date: { $lt: today } }
      ]
    });

    // 3. Tổng số lượng bài đăng tuyển dụng đang đợi duyệt
    const waitingJobs = await Job.countDocuments({
      status: "waiting"
    });

    res.status(200).json({
      success: true,
      data: {
        activeJobs,
        expiredJobs,
        waitingJobs
      }
    });
  } catch (error) {
    console.error("Get admin job stats error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu, vui lòng thử lại sau",
      error: error.message
    });
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const today = new Date();
    let filter = {};

    if (status === "active") {
      filter = {
        status: "available",
        closed_date: { $gte: today }
      };
    } else if (status === "expired") {
      filter = {
        $or: [
          { status: "expired" },
          { status: "outdated" },
          { status: "available", closed_date: { $lt: today } }
        ]
      };
    } else if (status === "waiting") {
      filter = {
        status: "waiting"
      };
    } else {
      filter = { status: { $nin: ["deleted", "hidden"] } };
    }

    // Tính toán số liệu thống kê cho cards (luôn chạy đầy đủ không bị ảnh hưởng bởi filter status hiện tại)
    const activeJobs = await Job.countDocuments({
      status: "available",
      closed_date: { $gte: today }
    });

    const expiredJobs = await Job.countDocuments({
      $or: [
        { status: "expired" },
        { status: "outdated" },
        { status: "available", closed_date: { $lt: today } }
      ]
    });

    const waitingJobs = await Job.countDocuments({
      status: "waiting"
    });

    const totalJobs = await Job.countDocuments(filter);
    const totalPages = Math.ceil(totalJobs / limit) || 1;

    const jobs = await Job.find(filter)
      .sort({ job_id: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      stats: {
        activeJobs,
        expiredJobs,
        waitingJobs
      },
      data: jobs,
      pagination: {
        page,
        limit,
        totalPages,
        totalJobs
      }
    });
  } catch (error) {
    console.error("Get admin jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải danh sách bài đăng",
      error: error.message
    });
  }
};

export const hideUserJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const jobs = await Job.find({ post_user_id: Number(userId), status: { $ne: "hidden" } });

    for (const job of jobs) {
      job.original_status = job.status;
      job.status = "hidden";
      await job.save();
    }

    return res.status(200).json({
      success: true,
      message: `Đã tạm ẩn ${jobs.length} bài đăng của người dùng`
    });
  } catch (error) {
    console.error("Hide user jobs error:", error);
    return res.status(500).json({ message: "Lỗi server khi ẩn bài đăng", error: error.message });
  }
};

export const restoreUserJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    const jobs = await Job.find({ post_user_id: Number(userId), status: "hidden" });

    for (const job of jobs) {
      job.status = job.original_status || "available";
      job.original_status = undefined;
      await job.save();
    }

    return res.status(200).json({
      success: true,
      message: `Đã khôi phục ${jobs.length} bài đăng của người dùng`
    });
  } catch (error) {
    console.error("Restore user jobs error:", error);
    return res.status(500).json({ message: "Lỗi server khi khôi phục bài đăng", error: error.message });
  }
};

export const getUserJobCounts = async (req, res) => {
  try {
    const counts = await Job.aggregate([
      {
        $group: {
          _id: "$post_user_id",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {};
    counts.forEach(item => {
      if (item._id !== null && item._id !== undefined) {
        result[item._id] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("getUserJobCounts error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi lấy số lượng bài đăng", error: error.message });
  }
};