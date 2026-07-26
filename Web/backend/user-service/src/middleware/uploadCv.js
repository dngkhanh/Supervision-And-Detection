import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cvs",
    resource_type: "raw", 
    use_filename: true,
    unique_filename: true
  },
});

const uploadCv = multer({ storage });

export default uploadCv;