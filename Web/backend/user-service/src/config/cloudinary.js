import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// 🔥 đảm bảo env được load trước khi config
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DEBUG 1 lần (xong thì xoá)
console.log("Cloudinary config:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY ? "OK" : "MISSING",
});

export default cloudinary;
