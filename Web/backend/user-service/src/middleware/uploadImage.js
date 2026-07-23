import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "logos",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"]
  },
});

const uploadImage = multer({ storage });

export default uploadImage;
