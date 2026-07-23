import mongoose from "mongoose";
import dotenv from "dotenv";
import Job from "./src/models/job.js";

dotenv.config();
const dbUrl = process.env.MONGO_URI || process.env.DB_URL;

if (!dbUrl) {
  console.error("❌ Lỗi: Không tìm thấy biến kết nối DB trong file .env");
  process.exit(1);
}

const clear = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("✅ Đã kết nối MongoDB");
    console.log("⏳ Đang xóa toàn bộ dữ liệu Job...");
    const res = await Job.deleteMany({});
    console.log(`✅ Đã xóa thành công ${res.deletedCount} bản ghi Job.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi xóa:", err);
    process.exit(1);
  }
};

clear();
