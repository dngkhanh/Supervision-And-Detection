import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jobRoutes from "./routes/jobRoutes.js";
import rabbitconfig from "./config/rabbitconfig.js";
import jobOutdatedCron from "./cron/jobOutdated.cron.js"; // 👈 THÊM DÒNG NÀY

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// init rabbitmq
rabbitconfig();

// connect mongo + start cron
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Job-service ➜ MongoDB connected");

    // 🔥 START CRON SAU KHI CONNECT DB
    jobOutdatedCron();
  })
  .catch(console.log);

// health check
app.get("/health", (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  if (isMongoConnected) {
    return res.status(200).json({
      status: "UP",
      service: "job Service",
      database: "MongoDB",
      connectionStatus: "Connected",
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(503).json({
      status: "DOWN",
      service: "job Service",
      database: "MongoDB",
      connectionStatus: "Disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

// routes
app.use("/job", jobRoutes);

// start server
app.listen(process.env.PORT, () =>
  console.log(`Job-service running on PORT ${process.env.PORT}`)
);
