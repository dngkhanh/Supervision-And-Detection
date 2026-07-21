import User from '../models/user.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

export const uploadCvController = async (req, res) => {
  try {
    // 1. Lấy user_id từ thông tin đăng nhập (middleware truyền vào)
    // Lưu ý: Tùy vào cách bạn gắn vào req ở middleware auth, có thể là req.user.id hoặc req.user.user_id
    const userId = req.user.user_id; 

    // 2. Kiểm tra xem file có được gửi lên không
    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file CV để upload" });
    }

    const cvUrl = req.file.path; // Đường dẫn file sau khi qua middleware (multer/cloudinary)

    // 3. Tìm user và cập nhật trường cv_path
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId }, // Tìm theo user_id (kiểu Number trong schema của bạn)
      { cv_path: cvUrl },   // Gán link CV mới vào
      { new: true }         // Trả về dữ liệu mới nhất sau khi update
    ).select("-password");  // Không trả về password để bảo mật

    // 4. Kiểm tra nếu không tìm thấy user
    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng để cập nhật CV" });
    }

    // 5. Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: "Tải CV lên thành công",
      cv_path: updatedUser.cv_path,
      user: updatedUser
    });

  } catch (err) {
    console.error("Lỗi khi cập nhật CV:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi tải CV", error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.user_id; // Lấy từ token đã đăng nhập
    const user = await User.findOne({ user_id: userId }).select("cv_path full_name");

    if (!user || !user.cv_path) {
      return res.status(404).json({ message: "Người dùng chưa có CV" });
    }

    res.json({
      success: true,
      cv_url: user.cv_path // Trả link này về cho Frontend
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const { userId } = req.params; // Lấy số 4 từ URL
    const updateData = req.body;

    // Nếu có upload file CV trong request này
    if (req.file) {
      updateData.cv_path = req.file.path;
    }

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

    // (Token đã được verify ở middleware, chỉ cần tồn tại là được)
    // req.user.user_id => user đang đăng nhập (KHÔNG cần so sánh)

    // Tìm user theo user_id truyền vào
    const user = await User.findOne({ user_id }).select("cv_path full_name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    if (!user.cv_path) {
      return res.status(404).json({
        success: false,
        message: "Người dùng chưa tải CV"
      });
    }

    // Trả link CV
    res.status(200).json({
      success: true,
      user_id: user.user_id,
      full_name: user.full_name,
      cv_url: user.cv_path
    });

  } catch (error) {
    console.error("Lỗi getCvByUserId:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi Server"
    });
  }
};