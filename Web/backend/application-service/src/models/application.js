import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema({
  application_id: Number,
  user_id: Number,
  job_id: Number
});

export default mongoose.model("Application", ApplicationSchema,"application");
