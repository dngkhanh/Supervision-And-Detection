import express from "express";
import { getAllJobs, createJob ,searchJobs,getRandomJobs,getJobById,getJobsPagination,getJobsForHomePagination,search_fill,getPostedJob,getWaitingJobs,acceptJob,refuseJob} from "../controllers/jobController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { optionalVerifyToken } from "../middleware/optionalVerifyToken.js";
import { checkAdminOnly } from "../middleware/checkAdminOnly.js";

const router = express.Router();

router.get("/", getAllJobs);
router.get("/search", optionalVerifyToken, searchJobs);
router.post("/", verifyToken, createJob);
router.get("/home", getJobsForHomePagination);
router.get("/search_fill", verifyToken, search_fill);
router.get('/random', getRandomJobs);
router.get('/pagination', getJobsPagination);
router.get('/posted', verifyToken, getPostedJob);
router.get('/waiting', checkAdminOnly, getWaitingJobs);
router.post('/accept', checkAdminOnly, acceptJob);
router.post('/refuse', checkAdminOnly, refuseJob);

router.get("/:id", verifyToken, getJobById);

export default router;
