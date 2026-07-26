import jwt from "jsonwebtoken";

export const checkAdminOnly = (req, res, next) => {
  // 1. Lấy token từ header
  const tokenHeader = req.headers.authorization;
  
  if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: "Bạn chưa đăng nhập hoặc định dạng Token không đúng" 
    });
  }

  const token = tokenHeader.split(" ")[1];

  try {
    // 2. Xác thực Token (Verify)
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // 3. Kiểm tra Role ngay lập tức
    // Dựa trên payload bạn đã nén ở hàm login: { user_id, role_id, username }
    if (decoded.role_id !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: "Truy cập bị từ chối: Chỉ dành cho Admin" 
      });
    }

    // Gán thông tin vào req để các controller phía sau có thể sử dụng (nếu cần)
    req.user = decoded; 
    
    next(); // Hợp lệ cả 2 điều kiện thì cho đi tiếp
  } catch (error) {
    console.error("Lỗi xác thực Admin:", error.message);
    return res.status(403).json({ 
      success: false, 
      message: "Token không hợp lệ hoặc đã hết hạn" 
    });
  }
};