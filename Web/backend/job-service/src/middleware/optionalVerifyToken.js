import jwt from "jsonwebtoken";

export const optionalVerifyToken = (req, res, next) => {
  const tokenHeader = req.headers.authorization;

  // ❌ Không có token → cho đi tiếp
  if (!tokenHeader) {
    req.user = null;
    return next();
  }

  // ❌ Sai format → cho đi tiếp
  if (!tokenHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = tokenHeader.split(" ")[1].trim();
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // ✅ có user
  } catch (err) {
    // ❌ Token sai / hết hạn → coi như guest
    req.user = null;
  }

  next();
};
