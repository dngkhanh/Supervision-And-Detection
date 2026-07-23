import express from "express";
import { getAllApplications, createApplication, applyJob, getJobApply, checkApplied, getAllAppliedJob, cancelApplied, getApplierId, getApplierCV, downloadCVZip, cleanupUserApplications } from "../controllers/applicationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllApplications);
router.post("/", createApplication);
router.post("/apply", verifyToken, applyJob);
router.get("/applied", verifyToken, getJobApply);
router.get("/check-applied/:job_id", verifyToken, checkApplied);
router.get("/all-applied", verifyToken, getAllAppliedJob);
router.delete("/cancel-applied", verifyToken, cancelApplied);
router.delete("/admin/cleanup-user-applications/:userId", cleanupUserApplications);
router.get("/applier-id/:job_id", verifyToken, getApplierId);
router.get("/applier-cv/:job_id", verifyToken, getApplierCV);
router.post("/download-zip", verifyToken, downloadCVZip);

export default router;
