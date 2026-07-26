import amqp from 'amqplib';
import dotenv from "dotenv";

dotenv.config(); 

const AMQP_URL = process.env.RABBITMQ_URI;

// -------------------------------------------------------------
// 1. Hàm Producer: Dùng để gửi tin nhắn (Controller sẽ gọi hàm này)
// -------------------------------------------------------------
export const publishRecommendSearch = async (payload) => {
  try {
    if (!AMQP_URL) {
      throw new Error("Chưa cấu hình RABBITMQ_URI");
    }

    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();

    const exchange = "app_events";
    await channel.assertExchange(exchange, "direct", { durable: true });

    channel.publish(
      exchange,
      "user_search",
      Buffer.from(JSON.stringify(payload))
    );

    console.log("[Job] 🚀 Publish search event:", payload.keyword);

    setTimeout(() => connection.close(), 500);
  } catch (err) {
    console.error("❌ Job Publisher error:", err.message);
  }
};


// -------------------------------------------------------------
// 2. Hàm Default: Để index.js gọi lúc khởi động server (FIX LỖI CỦA BẠN)
// -------------------------------------------------------------
const connectRabbitMQ = async () => {
    try {
        console.log("Testing RabbitMQ Connection...");
        const connection = await amqp.connect(AMQP_URL);
        console.log("✅ [Job Service] RabbitMQ Connected successfully!");
        // Test xong đóng luôn cho đỡ tốn resource
        connection.close();
    } catch (error) {
        console.error("❌ [Job Service] RabbitMQ Connection Failed:", error.message);
    }
};

export default connectRabbitMQ;