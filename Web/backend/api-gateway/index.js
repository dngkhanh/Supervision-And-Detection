import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();
const app = express();

app.use(cors());

app.use("/user", createProxyMiddleware({
  target: "http://user-service:3001",
  changeOrigin: true
}));

app.use("/job", createProxyMiddleware({
  target: "http://job-service:3002",
  changeOrigin: true
}));

app.use("/application", createProxyMiddleware({
  target: "http://application-service:3003",
  changeOrigin: true
}));

app.use("/recommend", createProxyMiddleware({
  target: "http://recommend-service:3004",
  changeOrigin: true
}));

app.listen(process.env.PORT, () =>
  console.log(`API Gateway running on PORT ${process.env.PORT}`),
  console.log(`check nodemon123456`)
);
