import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cvs",
    // Chuyển từ "raw" sang "image" để Cloudinary hỗ trợ Preview PDF tốt hơn
    resource_type: "image", 
    // Giữ nguyên format pdf
    format: "pdf",
    // Thêm flag để tối ưu cho việc xem/tải
    flags: "attachment", // Cho phép trình duyệt xử lý lệnh tải về dễ hơn
  },
});

const uploadCv = multer({ storage });

export default uploadCv;