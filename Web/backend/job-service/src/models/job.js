import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
  job_id: Number,
  job_title: String,
  company_name: String,
  closed_date: Date,
  salary: String,
  area: String,
  experience: String,
  degree: String,
  post_user_id: Number,
  description: String,
  requirements: String,
  benefits: String,
  status: String,
  original_status: String,
  industry: String,
  level: String,
  work_type: String,
  province: String,
  district: String,
  address: String,
  company_logo: String,
  working_time: String,
  locations: [{
    city: String,
    district: String,
    addressDetail: String
  }],
  categories: [String]
}, { timestamps: true });

export default mongoose.model("Job", JobSchema, "job");