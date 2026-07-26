import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();
const app = express();

app.use(cors());

// health check
app.get("/health", async (req, res) => {
  const services = [
    { name: "user-service", url: "http://user-service:3001/health" },
    { name: "job-service", url: "http://job-service:3002/health" },
    { name: "application-service", url: "http://application-service:3003/health" },
    { name: "recommend-service", url: "http://recommend-service:3004/health" }
  ];

  const checks = await Promise.allSettled(
    services.map(async (srv) => {
      try {
        const response = await fetch(srv.url);
        if (srv.name === "recommend-service" && response.status === 404) {
          // Fallback if endpoint structure differs
          return { service: srv.name, status: "UP", message: "Service is reachable" };
        }
        if (response.ok) {
          const data = await response.json();
          return { service: srv.name, status: "UP", details: data };
        }
        return { service: srv.name, status: "DOWN", error: `HTTP ${response.status}` };
      } catch (err) {
        return { service: srv.name, status: "DOWN", error: err.message };
      }
    })
  );

  const results = checks.map((c, idx) => {
    if (c.status === "fulfilled") {
      return c.value;
    }
    return { service: services[idx].name, status: "DOWN", error: "Check execution failed" };
  });

  const isAnyDown = results.some(r => r.status === "DOWN");

  res.status(isAnyDown ? 503 : 200).json({
    status: isAnyDown ? "DEGRADED" : "UP",
    service: "API Gateway",
    timestamp: new Date().toISOString(),
    dependencies: results
  });
});

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
