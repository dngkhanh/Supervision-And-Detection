import cron from "node-cron";
import Job from "../models/job.js";

const jobOutdatedCron = () => {
  /**
   * Chạy mỗi ngày lúc 00:00
   * Test thì đổi thành: "* * * * *"
   */
  cron.schedule("0 0 * * *", async () => {
    try {
      // Lấy thời điểm hiện tại
      const now = new Date();

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
    } catch (error) {
      console.error("❌ Cron job outdated error:", error);
    }
  });
};

export default jobOutdatedCron;
