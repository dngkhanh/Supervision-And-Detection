import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  job_id: Number,                 // nếu muốn auto thì bỏ field này
  job_title: String,
  company_name: String,
  closed_date: Date,
  salary: String, // Đã đổi từ Number sang String
  area: String,
  experience: String,
  degree: String,
  post_user_id: Number,
  description: String,
  requirements: String,
  benefits: String,
  status: String  // available, waitting, deleted, outdated
}, { timestamps: true });

export default mongoose.model("Job", JobSchema,"job");