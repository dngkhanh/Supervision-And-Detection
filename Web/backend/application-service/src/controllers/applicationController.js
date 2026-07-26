import Application from "../models/application.js";
import axios from "axios";
import { ZipArchive } from 'archiver';

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

    const { job_id, cv_path, original_filename } = req.body;

    if (!job_id || !cv_path || !original_filename) {
      return res.status(400).json({ message: "Thiếu thông tin ứng tuyển (job_id, cv_path, original_filename)" });
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
      job_id,
      cv_path,
      original_filename
    });
    console.log("New application created:", application);
    await application.save();

    // Gọi sang user-service để tăng biến đếm applied_job
    try {
      await fetch(`${USER_SERVICE_URL}/increment-applied/${user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Lỗi khi tăng biến đếm applied_job:", err);
    }

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
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    const applications = await Application.find({ user_id });

    if (applications.length === 0) {
      return res.status(200).json({
        count: 0,
        data: []
      });
    }

    const jobIds = applications.map(app => app.job_id);

    const token = req.headers.authorization;

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
    const existed = await Application.findOne({ user_id, job_id: Number(job_id) });

    if (!existed) {
      return res.status(404).json({
        message: "Bạn chưa apply job này hoặc đã hủy trước đó"
      });
    }

    const { cv_path } = existed;

    // 4. Xóa application
    await Application.deleteOne({ user_id, job_id: Number(job_id) });

    // 5. Gọi user-service để giảm biến đếm applied_job cho ứng viên
    try {
      await fetch(`${USER_SERVICE_URL}/decrement-applied/${user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Lỗi khi giảm biến đếm applied_job:", err.message);
    }

    // 6. Xóa CV khỏi Cloudinary bằng cách gọi sang user-service
    if (cv_path) {
      try {
        const deleteRes = await fetch(`${USER_SERVICE_URL}/delete-file`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": req.headers.authorization || ""
          },
          body: JSON.stringify({ url: cv_path })
        });
        const deleteData = await deleteRes.json();
        console.log("Cloudinary CV deletion result:", deleteData);
      } catch (err) {
        console.error("Lỗi khi gửi yêu cầu xóa file Cloudinary:", err.message);
      }
    }

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
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    const { job_id } = req.params;

    if (!job_id) {
      return res.status(400).json({
        message: "Thiếu job_id"
      });
    }

    const token = req.headers.authorization;

    const jobResponse = await axios.get(
      `${JOB_SERVICE_URL}/${job_id}`,
      {
        headers: {
          Authorization: token
        }
      }
    );

    const job = jobResponse.data;

    if (job.post_user_id !== user_id) {
      return res.status(403).json({
        message: "Bạn không có quyền xem danh sách ứng tuyển job này"
      });
    }

    const applications = await Application.find(
      { job_id: Number(job_id) },
      { _id: 0, user_id: 1 }
    );

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
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Bạn chưa đăng nhập"
      });
    }

    const { job_id } = req.params;

    if (!job_id) {
      return res.status(400).json({
        message: "Thiếu job_id"
      });
    }

    const token = req.headers.authorization;

    const jobResponse = await axios.get(
      `${JOB_SERVICE_URL}/${job_id}`,
      {
        headers: {
          Authorization: token
        }
      }
    );

    const job = jobResponse.data;

    if (job.post_user_id !== user_id) {
      return res.status(403).json({
        message: "Bạn không có quyền xem CV ứng viên của job này"
      });
    }

    const applications = await Application.find(
      { job_id: Number(job_id) },
      { _id: 0, user_id: 1, cv_path: 1, original_filename: 1 }
    );

    if (applications.length === 0) {
      return res.status(200).json({
        job_id,
        count: 0,
        data: []
      });
    }

    const cvList = [];

    for (const app of applications) {
      try {
        const response = await axios.get(
          `${USER_SERVICE_URL}/cv/${app.user_id}`,
          { headers: { Authorization: token } }
        );
        
        cvList.push({
          user_id: app.user_id,
          full_name: response.data?.full_name || `Ứng viên #${app.user_id}`,
          cv_path: app.cv_path || response.data?.cv_url || null,
          original_filename: app.original_filename || null
        });
      } catch (err) {
        console.log(`❌ Không lấy được thông tin của user ${app.user_id}:`, err.message);
        cvList.push({
          user_id: app.user_id,
          full_name: `Ứng viên #${app.user_id}`,
          cv_path: app.cv_path || null,
          original_filename: app.original_filename || null
        });
      }
    }

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

export const downloadCVZip = async (req, res) => {
  try {
    const { cvs } = req.body;
    if (!cvs || !Array.isArray(cvs) || cvs.length === 0) {
      return res.status(400).json({ message: "Danh sách CV không hợp lệ" });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=cvs.zip');

    const archive = new ZipArchive({
      zlib: { level: 9 }
    });

    archive.on('error', function(err) {
      console.error("Lỗi tạo zip:", err);
      res.status(500).end();
    });

    archive.pipe(res);

    for (let i = 0; i < cvs.length; i++) {
      const cv = cvs[i];
      if (cv.cv_path) {
        try {
          const fileResponse = await axios.get(cv.cv_path, { responseType: 'stream' });
          const filename = cv.original_filename || "CV_Ung_Vien_.pdf";
          archive.append(fileResponse.data, { name: filename });
        } catch (err) {
          console.error("Không thể lấy CV từ :", err.message);
        }
      }
    }

    await archive.finalize();

  } catch (error) {
    console.error("Lỗi downloadCVZip:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
  }
};

export const cleanupUserApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    console.log("Starting cleanup for user applications:", userId);

    // 1. Tìm tất cả applications của user này
    const apps = await Application.find({ user_id: Number(userId) });

    // 2. Với mỗi application, nếu có cv_path, xóa file khỏi Cloudinary
    for (const app of apps) {
      if (app.cv_path) {
        try {
          // Gọi sang user-service để thực hiện xóa file Cloudinary bằng URL
          await fetch(`${USER_SERVICE_URL}/delete-file`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: app.cv_path })
          });
        } catch (err) {
          console.error(`Lỗi khi xóa CV ứng tuyển ${app.cv_path} trên Cloudinary:`, err.message);
        }
      }
    }

    // 3. Xóa toàn bộ applications của user này khỏi database
    await Application.deleteMany({ user_id: Number(userId) });

    return res.status(200).json({
      success: true,
      message: "Đã dọn dẹp toàn bộ đơn ứng tuyển và CV của người dùng"
    });
  } catch (error) {
    console.error("Cleanup user applications error:", error);
    return res.status(500).json({ message: "Lỗi server dọn dẹp ứng tuyển", error: error.message });
  }
};
