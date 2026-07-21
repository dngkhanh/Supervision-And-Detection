import express from "express";
import { getAllUsers, createUser,login,refreshToken ,register,getCurrentUser,uploadCvController,getUserProfile,updateUserController,getCvByUserId} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import uploadCv from "../middleware/uploadCv.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.post("/register", register);
router.post("/login", login);
router.get("/profile/:userId", verifyToken, getUserProfile);
router.post('/refresh-token', refreshToken);
router.put("/:userId", verifyToken, updateUserController);
router.post(
  "/upload-cv",
  verifyToken,
  uploadCv.single("cv"),
  uploadCvController
);
router.get("/cv/:user_id", verifyToken, getCvByUserId);
router.get('/me', verifyToken, getCurrentUser);

export default router;
