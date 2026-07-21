import amqp from 'amqplib';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Recommend from '../models/recommend.js'; 

dotenv.config();

const AMQP_URL = process.env.RABBITMQ_URI;

export const startWorker = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("✅ [Recommend Worker] Đã kết nối MongoDB");
        }

        if (!AMQP_URL) return console.error("❌ Thiếu RABBITMQ_URI");

        const connection = await amqp.connect(AMQP_URL);
        const channel = await connection.createChannel();

        const exchange = 'app_events';
        await channel.assertExchange(exchange, 'direct', { durable: true });
        const q = await channel.assertQueue('recommend_queue', { durable: true });
        await channel.bindQueue(q.queue, exchange, 'user_search');

        console.log("✅ [Recommend Worker] Đang chạy (Chế độ: Lưu 1 từ khóa mới nhất)...");

        channel.consume(q.queue, async (msg) => {
  if (!msg) return;

  try {
    const content = JSON.parse(msg.content.toString());
    const { userId, q: keyword, province } = content;

    console.log(
      `📥 [Recommend] User ${userId} | q="${keyword}" | province="${province}"`
    );

    await Recommend.findOneAndUpdate(
      { userId },
      {
        $set: {
          last_search: keyword ?? "",
          area: province ?? ""
        }
      },
      { upsert: true, new: true }
    );

    console.log("✅ Recommend updated");
    channel.ack(msg);

  } catch (err) {
    console.error("❌ Worker Recommend error:", err);
    channel.ack(msg);
  }
});

        } catch (error) {
            console.error("❌ Lỗi Worker:", error);
        }
};