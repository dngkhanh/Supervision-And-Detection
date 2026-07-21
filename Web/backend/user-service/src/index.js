import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";


dotenv.config();
const app = express();
import userRoutes from "./routes/userRoutes.js";
app.use(cors());
app.use(express.json());

// Connect Mongo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("User-service ➜ MongoDB connected"))
  .catch(console.log);

  app.get("/health", (req, res) => {
    // readyState 1: Connected, 2: Connecting, 3: Disconnecting, 0: Disconnected
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
        return res.status(200).json({
            status: "UP",
            service: "User Service",
            database: "MongoDB",
            connectionStatus: "Connected",
            timestamp: new Date().toISOString()
        });
    } else {
        // Status 503 (Service Unavailable) được dùng khi một dependency quan trọng bị lỗi
        return res.status(503).json({
            status: "DOWN",
            service: "User Service",
            database: "MongoDB",
            connectionStatus: "Disconnected",
            timestamp: new Date().toISOString()
        });
    }
});

// Routes
app.use("/user", userRoutes);

// Start service
app.listen(process.env.PORT, () =>
  console.log(`User-service 1 running on PORT ${process.env.PORT}`)
);
