import mongoose from "mongoose";

const RecommendSchema = new mongoose.Schema({
  userId: String,
  last_search: String,
  area: String
});

// --- SỬA Ở ĐÂY ---
// Kiểm tra: Nếu mongoose.models.Recommend đã có (do lần chạy trước hoặc file khác đã tạo) -> Dùng lại nó.
// Nếu chưa có -> Thì mới tạo mới bằng mongoose.model(...)
const Recommend = mongoose.models.Recommend || mongoose.model("Recommend", RecommendSchema,"recommend");

export default Recommend;