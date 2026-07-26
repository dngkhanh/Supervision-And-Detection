import express from "express";
import { getAllRecommends, createRecommend, getJobRecommendations } from "../controllers/recommendController.js";
import  verifyToken from "jsonwebtoken";
import { checkAuthOrGuest } from "../middleware/checkAuthOrGuest.js";

const router = express.Router();

router.get("/", getAllRecommends);
router.post("/", createRecommend);
router.get("/recommend", checkAuthOrGuest, getJobRecommendations);


export default router;
