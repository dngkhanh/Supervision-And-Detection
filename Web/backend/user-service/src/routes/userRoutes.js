import express from "express";
import { getAllUsers, createUser,login,refreshToken ,register,getCurrentUser,getUserProfile,updateUserController,getCvByUserId, uploadImageController, uploadFileController, incrementAppliedJob, decrementAppliedJob, deleteCloudinaryFile, createNotification, notifyAdmins, getNotifications, markNotificationRead, getUserPublicInfo, getAdminUsers, banUser, unbanUser, deleteUser } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { checkAdminOnly } from "../middleware/checkAdminOnly.js";
import uploadCv from "../middleware/uploadCv.js";
import uploadImage from "../middleware/uploadImage.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/register", register);
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserController);
router.get("/info/:userId", getUserPublicInfo);

// Notification routes
router.post("/notification", verifyToken, createNotification);
router.post("/notification/admins", verifyToken, notifyAdmins);
router.get("/notifications", verifyToken, getNotifications);
router.put("/notification/:id/read", verifyToken, markNotificationRead);

// Admin routes
router.get("/admin/users", verifyToken, checkAdminOnly, getAdminUsers);
router.put("/admin/users/:userId/ban", verifyToken, checkAdminOnly, banUser);
router.put("/admin/users/:userId/unban", verifyToken, checkAdminOnly, unbanUser);
router.delete("/admin/users/:userId", verifyToken, checkAdminOnly, deleteUser);

router.post(
  "/upload-image",
  verifyToken,
  uploadImage.single("image"),
  uploadImageController
);
router.post(
  "/upload-file",
  verifyToken,
  uploadCv.single("cv"), // Sử dụng chung uploadCv (lưu file PDF lên Cloudinary)
  uploadFileController
);
router.put("/increment-applied/:userId", incrementAppliedJob);
router.put("/decrement-applied/:userId", decrementAppliedJob);
router.delete("/delete-file", deleteCloudinaryFile);
router.get("/cv/:user_id", verifyToken, getCvByUserId);
router.get('/me', verifyToken, getCurrentUser);

export default router;
