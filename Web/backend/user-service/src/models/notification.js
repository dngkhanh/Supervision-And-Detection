import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  notification_id: { type: Number, unique: true },
  user_id: { type: Number, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// Auto-increment notification_id
NotificationSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastNotification = await this.constructor.findOne({}, {}, { sort: { 'notification_id': -1 } });
      this.notification_id = lastNotification && lastNotification.notification_id ? lastNotification.notification_id + 1 : 1;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

export default mongoose.model("Notification", NotificationSchema, "notifications");
