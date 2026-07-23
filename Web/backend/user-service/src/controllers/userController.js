import User from '../models/user.js';
import Notification from "../models/notification.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";

export const uploadImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file ảnh để upload" });
    }
    res.status(200).json({
      success: true,
      image_url: req.file.path
    });
  } catch (err) {
    console.error("Lỗi khi upload ảnh:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi tải ảnh", error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const createUser = async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
};

// --- HÀM LOGIN SỬA ĐỔI ---
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Tìm user trong DB
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: username + " không tồn tại!" });
    }

    if (user.status === 'Deleted') {
      return res.status(404).json({ message: username + " không tồn tại!" });
    }

    if (user.status === 'Banned') {
      return res.status(403).json({
        status: "error",
        message: `Tài khoản của bạn đã bị khóa vì lý do: ${user.ban_reason || 'Không có lý do cụ thể'}`
      });
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không đúng!" });
    }

    // 3. Chuẩn bị dữ liệu để nén vào token
    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
      username: user.username
    };
    console.log("SIGN AT:", new Date());

    // --- THAY ĐỔI Ở ĐÂY: TẠO 2 TOKEN ---

    // Token 1: Access Token (Hết hạn sau 15 phút)
    const accessToken = jwt.sign(
      payload, 
      process.env.ACCESS_TOKEN_SECRET, // Khóa bí mật cho Access Token
      { expiresIn: '15m' }        // Thời gian: 15 minutes
    );

    // Token 2: Refresh Token (Hết hạn sau 7 ngày)
    const refreshToken = jwt.sign(
      payload, 
      process.env.REFRESH_TOKEN_SECRET, // Khóa bí mật cho Refresh Token (Nên khác key trên)
      { expiresIn: '7d' }          // Thời gian: 7 days
    );

    // 4. Ẩn mật khẩu user
    const { password: pass, ...userInfo } = user.toObject(); 

    // 5. Trả về cả 2 token
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        role_id: user.role_id,
        username: user.username,
        user_id: user.user_id
      },
      accessToken: accessToken,   // Token ngắn hạn
      refreshToken: refreshToken  // Token dài hạn
    });

  } catch (error) {
    console.error("Lỗi Login:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const refreshToken = async (req, res) => {
    // 1. Lấy Refresh Token từ body của request
    const { refreshToken } = req.body;

    // Kiểm tra xem Refresh Token có tồn tại không
    if (!refreshToken) {
        // 
        return res.status(401).json({ 
            success: false, 
            message: "Không tìm thấy Refresh Token. Vui lòng đăng nhập lại." 
        });
    }

    try {
        // 2. Xác thực Refresh Token
        // Sử dụng khóa bí mật của Refresh Token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Dữ liệu đã được giải mã: decoded.user_id, decoded.role_id, decoded.username
        
        // ** (Tùy chọn) 3. Kiểm tra user trong DB (để đảm bảo user chưa bị xóa hoặc thay đổi)**
        // const user = await User.findOne({ user_id: decoded.user_id });
        // if (!user) {
        //     return res.status(403).json({ success: false, message: "User không tồn tại." });
        // }

        // 4. Chuẩn bị payload để tạo Access Token MỚI
        const payload = {
            user_id: decoded.user_id,
            role_id: decoded.role_id,
            username: decoded.username
        };

        // 5. Tạo Access Token MỚI (Vẫn giữ thời gian hết hạn ngắn, ví dụ 15 phút)
        const newAccessToken = jwt.sign(
            payload,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' } // 15 minutes
        );

        // 6. Trả về Access Token mới cho client
        res.status(200).json({
            success: true,
            message: "Access Token đã được làm mới thành công.",
            accessToken: newAccessToken
        });

    } catch (error) {
        // Nếu xác thực thất bại (ví dụ: token hết hạn, sai chữ ký,...)
        console.error("Lỗi Refresh Token:", error.message);
        return res.status(403).json({ 
            success: false, 
            message: "Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại." 
        });
    }
};

export const register = async (req, res) => {
  try {
    // Nhận dữ liệu cần thiết từ body
    const { username, password, email, full_name } = req.body;

    // 1. Kiểm tra xem username hoặc email đã tồn tại trong DB chưa
    const existingUser = await User.findOne({ 
      $or: [{ username: username }, { email: email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false,
          message: "Tên đăng nhập đã tồn tại." 
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ 
          success: false,
          message: "Email đã được sử dụng." 
        });
      }
    }

    // 2. Xác định user_id tiếp theo (Tương tự logic auto-increment)
    const lastUser = await User.findOne().sort({ user_id: -1 }).select('user_id');
    const nextUserId = lastUser && lastUser.user_id ? lastUser.user_id + 1 : 1;
    
    // 3. Hash mật khẩu (Sử dụng bcrypt)
    // Tăng cường bảo mật bằng cách tạo salt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 4. Tạo đối tượng User mới 
    // Giả định role_id mặc định là 2 (User/Candidate)
    const newUser = {
      user_id: nextUserId,
      username,
      password: hashedPassword, // Mật khẩu đã được hash
      email,
      full_name: full_name || '', // Có thể là trường tùy chọn
      role_id: 2 
    };
    
    // 5. Lưu User vào database
    const user = await User.create(newUser);
    
    // 6. Trả về thông tin user đã đăng ký (không bao gồm mật khẩu)
    const { password: pass, ...userInfo } = user.toObject();

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      user: userInfo
    });
    
  } catch (error) {
    console.error("Lỗi Đăng ký:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi Server", 
      error: error.message 
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // 1. Lấy thông tin user từ token (đã decode trong middleware)
    const { user_id } = req.user;

    // 2. Tìm user trong DB
    const user = await User.findOne({ user_id }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại"
      });
    }

    // 3. Trả về thông tin user hiện tại
    res.status(200).json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
        cv_path: user.cv_path
      }
    });

  } catch (error) {
    console.error("Lỗi getCurrentUser:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi Server"
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Lấy từ token đã đăng nhập
    const user = await User.findOne({ user_id: userId }).select("full_name");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      cv_url: null // Đã loại bỏ CV mặc định
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }
    const updateData = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId }, 
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCvByUserId = async (req, res) => {
  try {
    // user_id của người MUỐN XEM CV (truyền từ URL)
    const { user_id } = req.params;

    // Tìm user theo user_id truyền vào
    const user = await User.findOne({ user_id }).select("full_name status");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const name = user.status === "Deleted" ? "Người dùng đã bị xóa" : user.full_name;

    res.status(200).json({
      success: true,
      user_id: user.user_id,
      full_name: name,
      cv_url: null // Đã loại bỏ CV mặc định
    });

  } catch (error) {
    console.error("Lỗi getCvByUserId:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi Server"
    });
  }
};

export const uploadFileController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file để upload" });
    }
    return res.status(200).json({
      url: req.file.path,
      original_filename: req.file.originalname
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return res.status(500).json({ message: "Lỗi server khi upload file", error: error.message });
  }
};

export const incrementAppliedJob = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $inc: { applied_job: 1 } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Applied job incremented", user });
  } catch (error) {
    console.error("Increment applied job error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { user_id, message } = req.body;
    if (!user_id || !message) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin user_id hoặc message" });
    }
    const notif = new Notification({ user_id, message });
    await notif.save();
    return res.status(201).json({ success: true, data: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const notifyAdmins = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin message" });
    }
    const admins = await User.find({ role_id: 1 });
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      message
    }));
    await Notification.insertMany(notifications);
    return res.status(201).json({ success: true, message: "Đã gửi thông báo đến các Admin" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server khi gửi thông báo đến các Admin", error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const notifications = await Notification.find({ user_id }).sort({ created_at: -1 });
    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    const notif = await Notification.findOneAndUpdate(
      { notification_id: id, user_id },
      { is_read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    return res.status(200).json({ success: true, data: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const getUserPublicInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    // Check if the param is a number (user_id) or a string (username)
    const isNum = !isNaN(userId) && !isNaN(parseFloat(userId));
    const query = isNum 
      ? { user_id: Number(userId) } 
      : { username: userId };

    const user = await User.findOne(query).select("user_id username full_name email status ban_reason");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy user" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const baseFilter = { status: { $ne: 'Deleted' } };
    const queryFilter = { ...baseFilter };

    if (req.query.status === 'Active') {
      queryFilter.status = { $nin: ['Banned', 'Deleted'] };
    } else if (req.query.status) {
      queryFilter.status = req.query.status;
    }

    // 1. Quét đếm tổng số lượng cho dashboard (luôn chạy đầy đủ không bị ảnh hưởng bởi bộ lọc status của bảng)
    const totalUsers = await User.countDocuments(baseFilter);
    const activeUsers = await User.countDocuments({ status: { $nin: ['Banned', 'Deleted'] } });
    const bannedUsers = await User.countDocuments({ status: 'Banned' });
    const candidates = await User.countDocuments({ role_id: 2, status: { $ne: 'Deleted' } });
    const admins = await User.countDocuments({ role_id: 1, status: { $ne: 'Deleted' } });

    // Số lượng dòng thỏa mãn filter hiện tại (dùng cho phân trang)
    const filteredCount = await User.countDocuments(queryFilter);

    // 2. Phân trang cho danh sách chi tiết
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const usersList = await User.find(queryFilter)
      .select("-password") // Không trả về trường mật khẩu bảo mật
      .sort({ user_id: -1 })
      .skip(skip)
      .limit(limit);

    // Fetch job counts from job-service (trying both internal docker dns and localhost fallback)
    let jobCounts = {};
    const urls = [
      "http://job-service:3002/job/admin/user-job-counts",
      "http://localhost:3002/job/admin/user-job-counts"
    ];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          if (json && json.success) {
            jobCounts = json.data || {};
            break;
          }
        }
      } catch (err) {
        console.log(`Failed to fetch job counts from ${url}: ${err.message}`);
      }
    }

    const usersWithJobCounts = usersList.map(u => {
      const userObj = u.toObject();
      userObj.posted_job = jobCounts[userObj.user_id] || 0;
      return userObj;
    });

    const totalPages = Math.ceil(filteredCount / limit) || 1;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        candidates,
        admins
      },
      data: usersWithJobCounts,
      pagination: {
        page,
        limit,
        totalPages,
        totalUsers: filteredCount // Dùng số lượng thỏa mãn filter hiện tại cho phân trang
      }
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    res.status(500).json({
      success: false,
      message: "Hệ thống bận, vui lòng thử lại sau",
      error: error.message
    });
  }
};

const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const rightPart = parts[1];
    const slashIdx = rightPart.indexOf('/');
    if (slashIdx === -1) return rightPart;
    
    return rightPart.substring(slashIdx + 1);
  } catch (err) {
    console.error("Parse public_id error:", err);
    return null;
  }
};

const cleanupUserFilesAndApps = async (user) => {
  try {
    // 1. Xóa CV profile trên Cloudinary nếu có
    if (user.cv_path) {
      const publicId = getPublicIdFromUrl(user.cv_path);
      if (publicId) {
        console.log("Cleanup user profile CV:", publicId);
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      }
      user.cv_path = null;
    }

    // 2. Gọi sang application-service để dọn dẹp các đơn ứng tuyển và CV ứng tuyển
    try {
      const res = await fetch(`http://application-service:3003/application/admin/cleanup-user-applications/${user.user_id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      console.log("Cleanup user applications result:", data);
    } catch (appCleanupErr) {
      console.error("Lỗi khi gọi dọn dẹp ứng tuyển ở application-service:", appCleanupErr.message);
    }

    // 3. Gọi sang job-service để tạm ẩn toàn bộ tin tuyển dụng của user này
    try {
      const res = await fetch(`http://job-service:3002/job/admin/hide-user-jobs/${user.user_id}`, {
        method: "PUT"
      });
      const data = await res.json();
      console.log("Hide recruiter jobs result:", data);
    } catch (jobHideErr) {
      console.error("Lỗi khi gọi tạm ẩn bài đăng ở job-service:", jobHideErr.message);
    }
  } catch (err) {
    console.error("Lỗi dọn dẹp tài liệu người dùng:", err.message);
  }
};

export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp lý do khóa tài khoản" });
    }

    const user = await User.findOne({ user_id: Number(userId) });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản người dùng" });
    }

    if (user.role_id === 1) {
      return res.status(403).json({ success: false, message: "Không thể khóa tài khoản Admin" });
    }

    user.status = "Banned";
    user.ban_reason = reason;
    
    // Tự động dọn dẹp tài liệu CV và đơn ứng tuyển của user khi bị BAN
    await cleanupUserFilesAndApps(user);
    
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Khóa tài khoản thành công",
      data: {
        user_id: user.user_id,
        status: user.status,
        ban_reason: user.ban_reason
      }
    });
  } catch (error) {
    console.error("Ban user error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi khóa tài khoản", error: error.message });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ user_id: Number(userId) });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản người dùng" });
    }

    user.status = "Active";
    user.ban_reason = null;

    // Tự động khôi phục toàn bộ tin tuyển dụng bị ẩn của user này khi được UNBAN
    try {
      const res = await fetch(`http://job-service:3002/job/admin/restore-user-jobs/${user.user_id}`, {
        method: "PUT"
      });
      const data = await res.json();
      console.log("Restore recruiter jobs result:", data);
    } catch (jobRestoreErr) {
      console.error("Lỗi khi khôi phục bài đăng ở job-service:", jobRestoreErr.message);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Mở khóa tài khoản thành công",
      data: {
        user_id: user.user_id,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Unban user error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi mở khóa tài khoản", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ user_id: Number(userId) });
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản người dùng" });
    }

    if (user.role_id === 1) {
      return res.status(403).json({ success: false, message: "Không thể xóa tài khoản Admin" });
    }

    user.status = "Deleted";
    
    // Tự động dọn dẹp tài liệu CV và đơn ứng tuyển của user khi bị XÓA
    await cleanupUserFilesAndApps(user);
    
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Xóa tài khoản thành công"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi xóa tài khoản", error: error.message });
  }
};

export const decrementAppliedJob = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $inc: { applied_job: -1 } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Applied job decremented", user });
  } catch (error) {
    console.error("Decrement applied job error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const deleteCloudinaryFile = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "Vui lòng cung cấp url file cần xóa" });
    }

    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      return res.status(400).json({ message: "URL Cloudinary không hợp lệ" });
    }

    console.log("Deleting Cloudinary file with publicId:", publicId);
    
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    
    return res.status(200).json({
      success: true,
      message: "Xóa file thành công",
      result
    });
  } catch (error) {
    console.error("Delete cloudinary file error:", error);
    return res.status(500).json({ message: "Server error khi xóa file", error: error.message });
  }
};