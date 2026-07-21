// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export const checkAuthOrGuest = (req, res, next) => {
  const tokenHeader = req.headers.authorization;
  // 1. TRƯỜNG HỢP KHÁCH (GUEST): Không có token Header
  if (!tokenHeader) {
    req.user = null; 
    return next();   // **CHO PHÉP KHÁCH ĐI TIẾP**
  }

  // 2. TRƯỜNG HỢP CÓ TOKEN HEADER: Kiểm tra định dạng
  if (!tokenHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Định dạng Token không hợp lệ" });
  }
  
  const token = tokenHeader.split(" ")[1]; 
  // BỔ SUNG: 2a. Xử lý token rỗng (ví dụ: Header là "Bearer ")
  if (!token) {
    req.user = null; // Coi như khách (Guest)
    return next(); 
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // Lưu thông tin user đã giải mã
    next(); // Token hợp lệ, đi tiếp
  } catch (error) {
    // THAY ĐỔI QUAN TRỌNG: 
    // 3. TRƯỜNG HỢP TOKEN KHÔNG HỢP LỆ/HẾT HẠN:
    // Log lỗi ra console nhưng vẫn cho phép đi tiếp (coi là Guest)
    console.error("Invalid token detected (Treating as Guest):", error.message);
    req.user = null; 
    next(); // **CHO PHÉP ĐI TIẾP (FIX LỖI 403 TRÊN PUBLIC ROUTE)**
  }
};