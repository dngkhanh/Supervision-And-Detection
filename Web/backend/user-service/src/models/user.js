import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  user_id: { type: Number },
  username: { type: String },
  password: { type: String },
  full_name: { type: String },
  email: { type: String },
  cv_path: { type: String, default: null },
  role_id: { type: Number }
});

export default mongoose.model("User", UserSchema, "user");  