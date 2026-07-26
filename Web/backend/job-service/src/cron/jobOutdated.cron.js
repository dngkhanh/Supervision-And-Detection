// Test trigger nodemon restart 2
import cron from "node-cron";
import Job from "../models/job.js";

const cleanupExpiredJobs = async () => {
  try {
    // Lấy thời điểm hiện tại
    const now = new Date();

    // Cập nhật các job vừa hết hạn sang trạng thái outdated
    const result = await Job.updateMany(
      {
        closed_date: { $lt: now },   // đã qua hạn
        status: { $ne: "outdated" }  // chưa bị outdated
      },
      {
        $set: { status: "outdated" }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `⏰ Cron: Đã cập nhật ${result.modifiedCount} job sang trạng thái outdated`
      );
    }

    // Lấy thời điểm 5 ngày trước
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Xóa các job đã hết hạn quá 5 ngày
    const deleteResult = await Job.deleteMany({
      closed_date: { $lt: fiveDaysAgo }
    });

    if (deleteResult.deletedCount > 0) {
      console.log(
        `⏰ Cron: Đã xóa ${deleteResult.deletedCount} job hết hạn quá 5 ngày`
      );
    }
  } catch (error) {
    console.error("❌ Cron job outdated/deletion error:", error);
  }
};

const jobOutdatedCron = () => {
  // Chạy ngay khi khởi động server để dọn dẹp các job cũ
  cleanupExpiredJobs();

  // Chạy mỗi ngày lúc 00:00
  cron.schedule("0 0 * * *", cleanupExpiredJobs);
};

export default jobOutdatedCron;
