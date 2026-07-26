import mongoose from "mongoose";
import dotenv from "dotenv";
import Job from "./src/models/job.js";

dotenv.config();
const dbUrl = process.env.MONGO_URI || process.env.DB_URL;

if (!dbUrl) {
  console.error("❌ Lỗi: Không tìm thấy biến kết nối DB trong file .env");
  process.exit(1);
}

const seed = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("✅ Đã kết nối MongoDB");

    // Xóa hết job cũ trước khi seed
    await Job.deleteMany({});
    console.log("🧹 Đã dọn sạch database");

    const jobsData = [
      // 12 ACTIVE JOBS (Còn hạn - status available, closed_date in future)
      {
        job_id: 1,
        job_title: "Senior Node.js Developer",
        company_name: "TechLink Solutions",
        closed_date: new Date("2026-08-30"),
        salary: "30,000,000 - 40,000,000 VND",
        area: "Quận 1, TP. HCM",
        experience: "3-5 năm",
        degree: "Đại học",
        post_user_id: 3,
        description: "Phát triển các API backend hiệu năng cao sử dụng Express/NestJS. Tối ưu hóa cơ sở dữ liệu MongoDB và Redis.",
        requirements: "Có kinh nghiệm vững chắc về JavaScript/TypeScript, thiết kế database.",
        benefits: "Lương tháng 13, bảo hiểm full lương, Mac Studio.",
        status: "available",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 2,
        job_title: "Frontend ReactJS Engineer",
        company_name: "VinaTech Global",
        closed_date: new Date("2026-09-15"),
        salary: "20,000,000 - 28,000,000 VND",
        area: "Cầu Giấy, Hà Nội",
        experience: "2 năm",
        degree: "Cao đẳng / Đại học",
        post_user_id: 3,
        description: "Xây dựng các giao diện web responsive bằng ReactJS, TailwindCSS. Tối ưu trải nghiệm người dùng.",
        requirements: "Kinh nghiệm với React Hooks, Redux Toolkit, Next.js.",
        benefits: "Đồ uống miễn phí, du lịch công ty 2 lần/năm.",
        status: "available",
        province: "Thành phố Hà Nội"
      },
      {
        job_id: 3,
        job_title: "Python AI Researcher",
        company_name: "AI Solutions Asia",
        closed_date: new Date("2026-10-01"),
        salary: "45,000,000 - 60,000,000 VND",
        area: "Đà Nẵng IT Park",
        experience: "2-4 năm",
        degree: "Thạc sĩ / Tiến sĩ",
        post_user_id: 4,
        description: "Nghiên cứu các thuật toán Machine Learning, Deep Learning cho bài toán xử lý ảnh và ngôn ngữ tự nhiên.",
        requirements: "Nắm chắc Python, PyTorch/TensorFlow, kiến thức toán học tốt.",
        benefits: "Được hỗ trợ chi phí nghiên cứu, tham dự hội thảo quốc tế.",
        status: "available",
        province: "Tỉnh Quảng Nam"
      },
      {
        job_id: 4,
        job_title: "Chuyên viên Marketing Digital",
        company_name: "Agency Media Max",
        closed_date: new Date("2026-08-25"),
        salary: "12,000,000 - 18,000,000 VND",
        area: "Quận 3, TP. HCM",
        experience: "1-2 năm",
        degree: "Đại học",
        post_user_id: 5,
        description: "Lên kế hoạch chạy quảng cáo Google Ads, Facebook Ads cho các brand thời trang, bán lẻ.",
        requirements: "Tư duy sáng tạo, kỹ năng thiết kế banner cơ bản, có kinh nghiệm quản lý ngân sách.",
        benefits: "Thưởng hoa hồng theo doanh số chiến dịch cực cao.",
        status: "available",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 5,
        job_title: "Nhân viên Bán hàng Showroom",
        company_name: "Bình Minh Mobile",
        closed_date: new Date("2026-09-30"),
        salary: "7,000,000 - 12,000,000 VND",
        area: "Quận Đống Đa, Hà Nội",
        experience: "Không yêu cầu",
        degree: "Trung học phổ thông",
        post_user_id: 6,
        description: "Tư vấn sản phẩm điện thoại di động và phụ kiện cho khách hàng tham quan showroom.",
        requirements: "Ngoại hình sáng, giao tiếp tự tin, chăm chỉ.",
        benefits: "Được đào tạo kỹ năng bài bản, cơ hội thăng tiến lên trưởng ca.",
        status: "available",
        province: "Thành phố Hà Nội"
      },
      {
        job_id: 6,
        job_title: "DevOps Engineer (AWS/Docker)",
        company_name: "Cloudify Technology",
        closed_date: new Date("2026-09-10"),
        salary: "35,000,000 - 50,000,000 VND",
        area: "Quận Hải Châu, Đà Nẵng",
        experience: "3 năm",
        degree: "Đại học",
        post_user_id: 4,
        description: "Thiết kế, xây dựng và quản trị hạ tầng điện toán đám mây AWS. Triển khai CI/CD pipeline.",
        requirements: "Kiến thức tốt về Docker, Kubernetes, Terraform, AWS Services.",
        benefits: "15 ngày phép năm, hỗ trợ laptop cấu hình cao tự chọn.",
        status: "available",
        province: "Thành phố Đà Nẵng"
      },
      {
        job_id: 7,
        job_title: "UI/UX Designer",
        company_name: "Creative Studio",
        closed_date: new Date("2026-08-20"),
        salary: "15,000,000 - 25,000,000 VND",
        area: "Quận 10, TP. HCM",
        experience: "2 năm",
        degree: "Cao đẳng / Đại học",
        post_user_id: 3,
        description: "Thiết kế giao diện App Mobile và Web Responsive. Nghiên cứu hành vi người dùng.",
        requirements: "Sử dụng thành thạo Figma, Adobe XD. Có portfolio sản phẩm thực tế.",
        benefits: "Thời gian làm việc linh hoạt, phòng trà bánh ngọt free.",
        status: "available",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 8,
        job_title: "Nhân viên Content Writer",
        company_name: "VinaNews Media",
        closed_date: new Date("2026-08-15"),
        salary: "9,000,000 - 14,000,000 VND",
        area: "Cầu Giấy, Hà Nội",
        experience: "1 năm",
        degree: "Đại học",
        post_user_id: 4,
        description: "Viết bài chuẩn SEO cho website, xây dựng content mạng xã hội (Facebook, TikTok).",
        requirements: "Kỹ năng viết lách tốt, nhanh nhạy bắt trend, chăm chỉ.",
        benefits: "Được làm việc với các chuyên gia SEO hàng đầu.",
        status: "available",
        province: "Thành phố Hà Nội"
      },
      {
        job_id: 9,
        job_title: "QA/QC Engineer (Automation)",
        company_name: "FSO Software",
        closed_date: new Date("2026-09-20"),
        salary: "18,000,000 - 26,000,000 VND",
        area: "Hải Châu, Đà Nẵng",
        experience: "2 năm",
        degree: "Đại học",
        post_user_id: 5,
        description: "Thiết lập kịch bản test tự động bằng Selenium hoặc Cypress cho các dự án Web.",
        requirements: "Có kiến thức tốt về OOP, biết viết test script bằng JS/Python.",
        benefits: "Thưởng dự án, lớp học tiếng Nhật miễn phí.",
        status: "available",
        province: "Thành phố Đà Nẵng"
      },
      {
        job_id: 10,
        job_title: "Mobile App Developer (Flutter)",
        company_name: "NeoTech",
        closed_date: new Date("2026-10-10"),
        salary: "22,000,000 - 32,000,000 VND",
        area: "Quận Phú Nhuận, TP. HCM",
        experience: "2-3 năm",
        degree: "Không yêu cầu",
        post_user_id: 6,
        description: "Phát triển và tối ưu hóa ứng dụng đa nền tảng iOS & Android bằng Flutter SDK.",
        requirements: "Kinh nghiệm với Dart, State Management (Provider/Bloc), RESTful API.",
        benefits: "Lương tháng 14, cấp Macbook Pro, khám sức khỏe định kỳ.",
        status: "available",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 11,
        job_title: "Nhân viên Chăm sóc Khách hàng",
        company_name: "Shopee Vietnam",
        closed_date: new Date("2026-08-31"),
        salary: "8,500,000 - 11,000,000 VND",
        area: "Quận 7, TP. HCM",
        experience: "Dưới 1 năm",
        degree: "Cao đẳng",
        post_user_id: 5,
        description: "Giải đáp thắc mắc và hỗ trợ người dùng ứng dụng Shopee qua kênh chat và điện thoại.",
        requirements: "Giao tiếp bình tĩnh, kiên nhẫn, giọng nói truyền cảm dễ nghe.",
        benefits: "Đóng bảo hiểm full lương từ tháng thử việc, phụ cấp ca đêm.",
        status: "available",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 12,
        job_title: "Business Analyst (IT BA)",
        company_name: "Smart solutions Co.",
        closed_date: new Date("2026-09-05"),
        salary: "25,000,000 - 35,000,000 VND",
        area: "Thanh Xuân, Hà Nội",
        experience: "3 năm",
        degree: "Đại học",
        post_user_id: 3,
        description: "Làm việc với khách hàng để thu thập yêu cầu hệ thống phần mềm, lập tài liệu SRS, User Story.",
        requirements: "Kỹ năng phân tích tốt, giao tiếp lưu loát, tiếng Anh chuyên ngành khá.",
        benefits: "Được đài thọ thi các chứng chỉ quốc tế liên quan.",
        status: "available",
        province: "Thành phố Hà Nội"
      },

      // 4 WAITING JOBS (Chờ duyệt - status waiting, closed_date in future)
      {
        job_id: 13,
        job_title: "Game Developer (Unity)",
        company_name: "Gaming Studio VN",
        closed_date: new Date("2026-09-12"),
        salary: "20,000,000 - 30,000,000 VND",
        area: "Quận Bình Thạnh, TP. HCM",
        experience: "2 năm",
        degree: "Đại học",
        post_user_id: 4,
        description: "Lập trình logic game, tối ưu hóa đồ họa 2D/3D trên nền tảng Unity.",
        requirements: "Thành thạo ngôn ngữ C#, có sản phẩm game demo trên Store.",
        benefits: "Phòng gym miễn phí, ăn nhẹ trà sữa chiều mỗi ngày.",
        status: "waiting",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 14,
        job_title: "Graphic Designer",
        company_name: "Future Media",
        closed_date: new Date("2026-08-18"),
        salary: "10,000,000 - 15,000,000 VND",
        area: "Hải Châu, Đà Nẵng",
        experience: "1 năm",
        degree: "Cao đẳng",
        post_user_id: 5,
        description: "Thiết kế các ấn phẩm truyền thông, bao bì sản phẩm, nhận diện thương hiệu.",
        requirements: "Sử dụng tốt Photoshop, Illustrator. Tư duy thẩm mỹ tốt.",
        benefits: "Làm việc trong môi trường sáng tạo, trẻ trung.",
        status: "waiting",
        province: "Thành phố Đà Nẵng"
      },
      {
        job_id: 15,
        job_title: "Copywriter chuyên sáng tạo nội dung",
        company_name: "Leo Burnett Vietnam",
        closed_date: new Date("2026-09-22"),
        salary: "14,000,000 - 22,000,000 VND",
        area: "Quận 3, TP. HCM",
        experience: "2 năm",
        degree: "Đại học",
        post_user_id: 6,
        description: "Lên ý tưởng sáng tạo cho các chiến dịch quảng cáo lớn của thương hiệu lớn.",
        requirements: "Có kinh nghiệm viết slogan, kịch bản video quảng cáo. Tiếng Anh tốt.",
        benefits: "Lương tháng 13 + thưởng tết ta hậu hĩnh.",
        status: "waiting",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 16,
        job_title: "Embedded Systems Engineer",
        company_name: "Renesas Design Vietnam",
        closed_date: new Date("2026-10-15"),
        salary: "25,000,000 - 38,000,000 VND",
        area: "Khu công nghệ cao Q9, TP. HCM",
        experience: "2-4 năm",
        degree: "Đại học kỹ thuật",
        post_user_id: 6,
        description: "Thiết kế và phát triển chương trình nhúng cho vi điều khiển ARM. Kiểm thử phần cứng.",
        requirements: "Thành thạo lập trình C/C++, có hiểu biết về mạch điện tử số.",
        benefits: "Môi trường chuẩn Nhật Bản, phụ cấp ngoại ngữ tốt.",
        status: "waiting",
        province: "Thành phố Hồ Chí Minh"
      },

      // 4 EXPIRED JOBS (Hết hạn - status available, closed_date in past OR status expired)
      {
        job_id: 17,
        job_title: "Chuyên viên Nhân sự Tuyển dụng",
        company_name: "HR Pioneer Co.",
        closed_date: new Date("2026-05-10"),
        salary: "12,000,000 - 16,000,000 VND",
        area: "Cầu Giấy, Hà Nội",
        experience: "2 năm",
        degree: "Đại học",
        post_user_id: 3,
        description: "Tìm kiếm ứng viên IT chất lượng cao. Sắp xếp lịch phỏng vấn và hỗ trợ onboard.",
        requirements: "Kỹ năng giao tiếp và nhìn người tốt. Có data ứng viên dồi dào.",
        benefits: "Đóng BHXH đầy đủ, thưởng theo head-count tuyển thành công.",
        status: "available",
        province: "Thành phố Hà Nội"
      },
      {
        job_id: 18,
        job_title: "Nhà phát triển Node.js Junior",
        company_name: "SmartCode",
        closed_date: new Date("2026-06-01"),
        salary: "12,000,000 - 16,000,000 VND",
        area: "Quận 1, TP. HCM",
        experience: "1 năm",
        degree: "Đại học",
        post_user_id: 4,
        description: "Tham gia phát triển module backend cho website bán hàng thương mại điện tử.",
        requirements: "Biết sử dụng ExpressJS, MongoDB cơ bản, chịu khó học hỏi.",
        benefits: "Được các Tech Lead giàu kinh nghiệm hướng dẫn tận tình.",
        status: "available",
        province: "Thành phố Hồ Chí Minh"
      },
      {
        job_id: 19,
        job_title: "Nhân viên Hành chính Nhân sự",
        company_name: "Tập đoàn Đại Nam",
        closed_date: new Date("2026-04-15"),
        salary: "8,000,000 - 10,000,000 VND",
        area: "Tỉnh Bình Dương",
        experience: "1 năm",
        degree: "Cao đẳng / Đại học",
        post_user_id: 5,
        description: "Quản lý chấm công, cấp phát văn phòng phẩm, hỗ trợ làm hồ sơ bảo hiểm xã hội.",
        requirements: "Nhanh nhẹn, trung thực, cẩn thận, biết sử dụng Word/Excel khá.",
        benefits: "Được hỗ trợ cơm trưa, đi xe đưa đón công ty.",
        status: "expired",
        province: "Tỉnh Bình Dương"
      },
      {
        job_id: 20,
        job_title: "IT Support / Helpdesk",
        company_name: "Học viện FPT",
        closed_date: new Date("2026-05-20"),
        salary: "10,000,000 - 13,000,000 VND",
        area: "Hải Châu, Đà Nẵng",
        experience: "1-2 năm",
        degree: "Cao đẳng kỹ thuật",
        post_user_id: 6,
        description: "Hỗ trợ kỹ thuật phần cứng, cài đặt phần mềm cho cán bộ nhân viên văn phòng.",
        requirements: "Hiểu biết về cài đặt HĐH Windows/macOS, xử lý sự cố mạng cơ bản.",
        benefits: "Có cơ hội tham gia các khóa học chuyên ngành công nghệ miễn phí.",
        status: "expired",
        province: "Thành phố Đà Nẵng"
      }
    ];

    await Job.insertMany(jobsData);
    console.log("🎉 Đã seed thành công 20 Jobs chuẩn sạch!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi seed:", err);
    process.exit(1);
  }
};

seed();
