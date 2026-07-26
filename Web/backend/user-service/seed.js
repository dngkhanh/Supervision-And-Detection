import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import bcrypt from "bcryptjs"; // <--- 1. Import thư viện băm
import User from "./src/models/user.js"; // Đảm bảo đường dẫn đúng

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const dbUrl = process.env.MONGO_URI || process.env.DB_URL;

if (!dbUrl) {
  console.error("❌ Lỗi: Không tìm thấy biến kết nối DB trong file .env");
  process.exit(1);
}

const seedUsers = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("✅ Đã kết nối MongoDB");

    // Dữ liệu thô (Mật khẩu vẫn để plain text ở đây cho dễ nhìn)
    const rawUsers = [
      {
        user_id: 1,
        username: "admin_vip",
        password: "adminpassword123", 
        full_name: "Admin Quản Trị",
        email: "admin@company.com",
        role_id: 1, 
        cv_path: null
      },
      {
        user_id: 2,
        username: "user_normal", 
        password: "userpassword456",
        full_name: "Người Dùng Mới",
        email: "user@company.com",
        role_id: 2,
        cv_path: null
      }
    ];

    console.log("⏳ Đang xử lý băm mật khẩu...");

    // 2. Duyệt qua từng user để băm mật khẩu
    for (const user of rawUsers) {
      
      // Tạo "muối" (salt) với độ phức tạp là 10
      const salt = await bcrypt.genSalt(10);
      
      // Băm mật khẩu
      const hashedPassword = await bcrypt.hash(user.password, salt);

      // Thay thế mật khẩu thường bằng mật khẩu đã băm
      user.password = hashedPassword;

      // 3. Lưu vào DB (Dùng Upsert như cũ)
      await User.findOneAndUpdate(
        { user_id: user.user_id }, 
        user,                      
        { upsert: true, new: true } 
      );
      console.log(`-> Đã xong user: ${user.username}`);
    }

    console.log("✅ Đã tạo dữ liệu thành công (Mật khẩu đã được mã hóa)!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Lỗi:", error);
    mongoose.connection.close();
  }
};

seedUsers();