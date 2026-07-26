import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Lấy token từ header: "Authorization: Bearer <token>"
  const tokenHeader = req.headers.authorization;

  if (!tokenHeader) {
    // 401 Unauthorized - Thiếu thông tin xác thực
    return res.status(401).json({ success: false, message: "Bạn chưa đăng nhập (Thiếu Token)" });
  }

  // Kiểm tra định dạng 'Bearer <token>'
  if (!tokenHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Định dạng Token không hợp lệ" });
  }
  
  // Tách chữ "Bearer" ra để lấy token
  const token = tokenHeader.split(" ")[1]; 

  try {
    // **SỬA Ở ĐÂY:** Sử dụng khóa bí mật của Access Token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Gán thông tin user vào req để dùng ở bước sau
    req.user = decoded; 
    
    next(); // Cho phép đi tiếp
  } catch (error) {
    // 403 Forbidden - Token không hợp lệ (hết hạn, sai chữ ký,...)
    // Quan trọng: Nếu token hết hạn (TokenExpiredError), client cần sử dụng Refresh Token
    return res.status(403).json({ success: false, message: "Access Token không hợp lệ hoặc đã hết hạn" });
  }
};