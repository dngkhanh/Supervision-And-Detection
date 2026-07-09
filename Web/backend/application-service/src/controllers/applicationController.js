import Application from "../models/application.js";
import axios from "axios";

const JOB_SERVICE_URL="http://job-service:3002/job";
const USER_SERVICE_URL="http://user-service:3001/user";

export const getAllApplications = async (req, res) => {
  const apps = await Application.find();
  res.json(apps);
};

export const createApplication = async (req, res) => {
  const app = await Application.create(req.body);
  res.json(app);
};

export const applyJob = async (req, res) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: "Thiếu job_id" });
    }

    // ⚠️ Kiểm tra user đã apply job này chưa
    const existed = await Application.findOne({ user_id, job_id });

    if (existed) {
      return res.status(400).json({
        message: "Bạn đã apply job này rồi"
      });
    }

    // Tạo application_id đơn giản
    const application_id = Date.now();

    // Lưu record mới
    const application = new Application({
      application_id,
      user_id,
      job_id
    });
    console.log("New application created:", application);
    await application.save();

    res.status(201).json({
      message: "Ứng tuyển thành công",
      data: application
    });

  } catch (error) {
    console.error("Apply Job Error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const getJobApply = async (req, res) => {
  try {
    // 1. Lấy user_id từ token
    const user_id = req.user?.user_id;
    if (!user_id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    // 2. Lấy token gốc để gửi kèm sang Job Service
    const token = req.headers.authorization;

    // 3. Tìm toàn bộ job_id user đã apply
    const applications = await Application.find({ user_id });
    console.log("Applications found:", applications);

    if (applications.length === 0) {
      return res.status(200).json({
        message: "User chưa apply job nào",
        data: []
      });
    }

    const jobIds = applications.map(a => a.job_id);

    // 4. Gửi lần lượt từng job_id sang Job Service
    const jobDetails = [];

    for (const id of jobIds) {
      try {
        const response = await axios.get(`${JOB_SERVICE_URL}/${id}`, {
          headers: { Authorization: token }
        });

        jobDetails.push(response.data);
      } catch (err) {
        console.log(`⚠️ Không lấy được job ${id}:`, err.message);
      }
    }

    return res.status(200).json({
      count: jobDetails.length,
      data: jobDetails
    });

  } catch (error) {
    console.error("Get Job Apply Error:", error.message);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const checkApplied = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { job_id } = req.params; // Lấy từ URL params cho tiện

    if (!user_id) {
      return res.status(200).json({ applied: false }); // Chưa đăng nhập thì coi như chưa apply
    }

    const existed = await Application.findOne({ user_id, job_id: Number(job_id) });

    if (existed) {
      return res.status(200).json({ applied: true });
    }

    res.status(200).json({ applied: false });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kiểm tra ứng tuyển", error: error.message });
  }
};

export const getAllAppliedJob = async (req, res) => {
  try {
    // 1. Lấy user_id từ token (verifyToken đã gán vào req.user)
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    // 2. Lấy toàn bộ application của user
    const applications = await Application.find({ user_id });

    if (applications.length === 0) {
      return res.status(200).json({
        count: 0,
        data: []
      });
    }

    const jobIds = applications.map(app => app.job_id);

    // 3. Lấy token gốc để forward sang Job Service
    const token = req.headers.authorization;

    // 4. Gọi Job Service lấy chi tiết từng job
    const jobs = [];

    for (const id of jobIds) {
      try {
        const response = await axios.get(`${JOB_SERVICE_URL}/${id}`, {
          headers: {
            Authorization: token
          }
        });

        jobs.push(response.data);
      } catch (err) {
        console.log(`⚠️ Không lấy được job ${id}:`, err.message);
      }
    }

    // 5. Trả dữ liệu cho frontend render
    return res.status(200).json({
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    console.error("Get All Applied Job Error:", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

export const cancelApplied = async (req, res) => {
  try {
    // 1. Lấy user_id từ token (đã verify)
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    // 2. Lấy job_id từ body
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({
        message: "Thiếu job_id"
      });
    }

    // 3. Kiểm tra application có tồn tại không
    const existed = await Application.findOne({ user_id, job_id });

    if (!existed) {
      return res.status(404).json({
        message: "Bạn chưa apply job này hoặc đã hủy trước đó"
      });
    }

    // 4. Xóa application
    await Application.deleteOne({ user_id, job_id });

    return res.status(200).json({
      message: "Hủy ứng tuyển thành công",
      data: {
        user_id,
        job_id
      }
    });

  } catch (error) {
    console.error("Cancel Applied Error:", error);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};

export const getApplierId = async (req, res) => {
  try {
    // 1. Lấy user_id đang đăng nhập
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    // 2. Lấy job_id (có thể lấy từ params hoặc body)
    const { job_id } = req.params;

    if (!job_id) {
      return res.status(400).json({
        message: "Thiếu job_id"
      });
    }

    // 3. Lấy token để gọi sang Job Service
    const token = req.headers.authorization;

    // 4. Gọi Job Service để lấy thông tin job
    const jobResponse = await axios.get(
      `${JOB_SERVICE_URL}/${job_id}`,
      {
        headers: {
          Authorization: token
        }
      }
    );

    const job = jobResponse.data;

    // 5. Kiểm tra quyền: chỉ chủ job mới xem được danh sách apply
    if (job.post_user_id !== user_id) {
      return res.status(403).json({
        message: "Bạn không có quyền xem danh sách ứng tuyển job này"
      });
    }

    // 6. Lấy tất cả application có job_id hiện tại
    const applications = await Application.find(
      { job_id: Number(job_id) },
      { _id: 0, user_id: 1 } // chỉ lấy user_id
    );

    // 7. Tách danh sách user_id
    const applierIds = applications.map(app => app.user_id);

    return res.status(200).json({
      job_id,
      count: applierIds.length,
      data: applierIds
    });

  } catch (error) {
    console.error("Get Applier Id Error:", error.message);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};


export const getApplierCV = async (req, res) => {
  try {
    // 1. Lấy user_id đang đăng nhập
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    // 2. Lấy job_id
    const { job_id } = req.params;

    if (!job_id) {
      return res.status(400).json({
        message: "Thiếu job_id"
      });
    }

    // 3. Lấy token để forward
    const token = req.headers.authorization;

    // 4. Gọi Job Service để kiểm tra quyền
    const jobResponse = await axios.get(
      `${JOB_SERVICE_URL}/${job_id}`,
      {
        headers: {
          Authorization: token
        }
      }
    );

    const job = jobResponse.data;

    // 5. Chỉ chủ job mới được xem CV
    if (job.post_user_id !== user_id) {
      return res.status(403).json({
        message: "Bạn không có quyền xem CV ứng viên của job này"
      });
    }

    // 6. Lấy danh sách user_id đã apply job
    const applications = await Application.find(
      { job_id: Number(job_id) },
      { _id: 0, user_id: 1 }
    );

    if (applications.length === 0) {
      return res.status(200).json({
        job_id,
        count: 0,
        data: []
      });
    }

    const applierIds = applications.map(app => app.user_id);

    // 7. Gọi User Service để lấy cv_path từng user
    const cvList = [];

    for (const id of applierIds) {
      try {
        const response = await axios.get(
          `${USER_SERVICE_URL}/cv/${id}`,
          {
            headers: {
              Authorization: token
            }
          }
        );

        cvList.push({
          user_id: id,
          cv_path: response.data?.cv_url || null
        });

      } catch (err) {
        console.log(`⚠️ Không lấy được CV của user ${id}:`, err.message);
        cvList.push({
          user_id: id,
          cv_path: null
        });
      }
    }

    // 8. Trả kết quả
    return res.status(200).json({
      job_id,
      count: cvList.length,
      data: cvList
    });

  } catch (error) {
    console.error("Get Applier CV Error:", error.message);
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message
    });
  }
};
