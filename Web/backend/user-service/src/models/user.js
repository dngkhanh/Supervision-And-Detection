import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  user_id: { type: Number },
  username: { type: String },
  password: { type: String },
  full_name: { type: String },
  email: { type: String },
  cv_path: { type: String, default: null },
  role_id: { type: Number },
  applied_job: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  ban_reason: { type: String, default: null }
});

export default mongoose.model("User", UserSchema, "user");  