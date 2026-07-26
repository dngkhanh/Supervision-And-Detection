import jwt from "jsonwebtoken";

export const checkAdminOnly = (req, res, next) => {
  const tokenHeader = req.headers.authorization;
  
  if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: "Bạn chưa đăng nhập hoặc định dạng Token không đúng" 
    });
  }

  const token = tokenHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    if (Number(decoded.role_id) !== 1) {
      return res.status(403).json({ 
        success: false, 
        message: "Truy cập bị từ chối: Chỉ dành cho Admin" 
      });
    }

    req.user = decoded; 
    next(); 
  } catch (error) {
    console.error("Lỗi xác thực Admin trong user-service:", error.message);
    return res.status(403).json({ 
      success: false, 
      message: "Token không hợp lệ hoặc đã hết hạn" 
    });
  }
};
