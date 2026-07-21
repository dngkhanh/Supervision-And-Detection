import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import Job from "./src/models/job.js"; // ⚠️ Đảm bảo đường dẫn này chính xác

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const dbUrl = process.env.MONGO_URI || process.env.DB_URL;

if (!dbUrl) {
  console.error("❌ Lỗi: Không tìm thấy biến kết nối DB trong file .env");
  process.exit(1);
}

const seedJobs = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("✅ Đã kết nối MongoDB");
    console.log("---------------------------------------------");

    // ==============================================
    // 💥 BƯỚC 1: XÓA TẤT CẢ DỮ LIỆU CŨ TRONG COLLECTION 'job'
    // ==============================================
    console.log("⏳ Đang xóa toàn bộ dữ liệu Job cũ...");
    const deleteResult = await Job.deleteMany({});
    console.log(`✅ Đã xóa thành công ${deleteResult.deletedCount} bản ghi cũ.`);
    console.log("---------------------------------------------");


    // Dữ liệu 30 công việc đã được chuẩn hóa theo Schema (có company_name và salary: String)
   const rawJobs = [
    {
        job_id: 1,
        job_title: "Senior Backend Developer (Node.js)",
        company_name: "Tech Solutions Corp.",
        closed_date: new Date("2026-02-02"),
        salary: "35,000,000 - 45,000,000 VND",
        area: "TP. Hồ Chí Minh",
        experience: "3-5 năm",
        degree: "Đại học",
        post_user_id: 101,
        description: "Phát triển và duy trì các dịch vụ backend hiệu suất cao, đảm bảo tính ổn định và khả năng mở rộng của hệ thống. \nTham gia vào quá trình thiết kế kiến trúc microservices mới và tối ưu hóa cơ sở dữ liệu (PostgreSQL/MongoDB). \nReview code, mentoring các thành viên junior và đóng góp vào quy trình kỹ thuật chung.",
        requirements: "Thành thạo JavaScript/TypeScript, Node.js, và các framework liên quan như Express/NestJS (ít nhất 3 năm kinh nghiệm thực tế). \nKinh nghiệm làm việc với kiến trúc Microservices, CI/CD, Docker/Kubernetes, và có hiểu biết sâu sắc về các mô hình thiết kế phần mềm. \nTiếng Anh giao tiếp tốt là một lợi thế lớn để làm việc với các đội ngũ quốc tế.",
        benefits: "Mức lương cạnh tranh (thương lượng theo năng lực), Lương tháng 13 + thưởng hiệu suất công việc cuối năm (KPIs). \nBảo hiểm xã hội, y tế, thất nghiệp đóng trên mức full lương, được cung cấp gói Bảo hiểm sức khỏe cao cấp. \nTrang thiết bị làm việc hiện đại: Macbook Pro đời mới, miễn phí ăn trưa, trợ cấp đi lại, và môi trường làm việc cởi mở, chuyên nghiệp.",
        status: "available"
    },
    {
        job_id: 2,
        job_title: "Frontend Developer (ReactJS)",
        company_name: "E-Commerce Growth",
        closed_date: new Date("2026-02-02"),
        salary: "20,000,000 - 30,000,000 VND",
        area: "Hà Nội",
        experience: "1-2 năm",
        degree: "Cao đẳng/Đại học",
        post_user_id: 102,
        description: "Xây dựng giao diện người dùng (UI/UX) cho các website e-commerce quy mô lớn, đảm bảo khả năng tương thích trên nhiều trình duyệt và thiết bị di động. \nTối ưu hóa hiệu suất ứng dụng (load time, rendering speed) để mang lại trải nghiệm tốt nhất cho người dùng. \nLàm việc chặt chẽ với đội ngũ Backend và UI/UX Designer để chuyển đổi mockup thành sản phẩm hoàn chỉnh.",
        requirements: "Có từ 1-2 năm kinh nghiệm thực tế với ReactJS và các thư viện quản lý trạng thái như Redux/Redux-Saga/Zustand. \nThành thạo HTML5, CSS3, JavaScript (ES6+), và đã từng làm việc với các Preprocessors như Sass/Less hoặc CSS-in-JS. \nCó kinh nghiệm với Responsive Design, Git, Webpack/Vite và đã từng triển khai các dự án thực tế lên môi trường Production.",
        benefits: "Thưởng dự án và thưởng Tết theo kết quả kinh doanh của công ty (từ 2-4 tháng lương). \nTeam building hàng quý (du lịch, dã ngoại), phụ cấp ăn trưa, gửi xe và hỗ trợ chi phí học tập, tham gia các khóa đào tạo chuyên môn. \nCơ hội làm việc với các công nghệ mới nhất trong lĩnh vực E-Commerce và lộ trình thăng tiến rõ ràng lên Senior/Tech Lead.",
        status: "available"
    },
    {
        job_id: 3,
        job_title: "Automation Tester (Selenium/Java)",
        company_name: "Quality Assurance Ltd.",
        closed_date: new Date("2026-02-02"),
        salary: "25,000,000 - 35,000,000 VND",
        area: "Đà Nẵng",
        experience: "Trên 2 năm",
        degree: "Đại học",
        post_user_id: 101,
        description: "Viết kịch bản kiểm thử tự động (Automation Test Script) cho các ứng dụng web và mobile sử dụng Selenium WebDriver và TestNG/Junit. \nThiết lập và duy trì Framework kiểm thử tự động, tích hợp vào hệ thống CI/CD (Jenkins). \nThực hiện kiểm thử hiệu năng (Performance Test) và báo cáo chi tiết kết quả kiểm thử cho đội ngũ phát triển.",
        requirements: "Có kinh nghiệm vững chắc (ít nhất 2 năm) trong việc viết script kiểm thử tự động bằng Java hoặc Python. \nThành thạo công cụ Selenium WebDriver, Postman (hoặc SoapUI), và có kinh nghiệm với SQL để kiểm tra dữ liệu. \nHiểu biết sâu về quy trình phát triển phần mềm Agile/Scrum và các công cụ quản lý lỗi (Jira, TestRail).",
        benefits: "Trợ cấp ngoại ngữ (tiếng Anh/tiếng Nhật) hàng tháng, Bảo hiểm sức khỏe PVI/Manulife cho bản thân và người thân. \nLương tháng 13 cố định và thưởng hiệu suất theo quý, được tham gia các buổi đào tạo chuyên sâu về QA/QC theo tiêu chuẩn quốc tế. \nPhụ cấp ăn trưa, gửi xe, môi trường làm việc thoải mái, đồng nghiệp thân thiện, có khu vực giải trí riêng cho nhân viên.",
        status: "available"
    },
    {
        job_id: 4,
        job_title: "Nhân viên Kinh doanh Bất động sản",
        company_name: "Landmark Real Estate",
        closed_date: new Date("2026-02-02"),
        salary: "10,000,000 VND + Hoa Hồng",
        area: "TP. Hồ Chí Minh",
        experience: "Không yêu cầu",
        degree: "Trung cấp",
        post_user_id: 205,
        description: "Tìm kiếm, mở rộng và phát triển mạng lưới khách hàng tiềm năng thông qua các kênh online và offline (Telesales, Facebook, Zalo, vv...). \nTư vấn, giới thiệu chuyên sâu các dự án căn hộ chung cư, nhà phố, đất nền đang được phân phối bởi công ty. \nHỗ trợ khách hàng trong mọi quy trình từ tham quan dự án, ký kết hợp đồng cho đến các thủ tục pháp lý liên quan.",
        requirements: "Yêu thích và có đam mê cháy bỏng với lĩnh vực Bất động sản. Có khả năng giao tiếp, thuyết trình và đàm phán tốt. \nNhanh nhẹn, có khả năng làm việc độc lập và chịu được áp lực cao từ chỉ tiêu doanh số. \nƯu tiên ứng viên có kinh nghiệm trong ngành Sales, Bán hàng hoặc Tài chính, tuy nhiên không yêu cầu kinh nghiệm BĐS (sẽ được đào tạo).",
        benefits: "Mức lương cứng cố định 10,000,000 VND/tháng (không áp doanh số). \nHoa hồng cao (2-3% giá trị hợp đồng), Thưởng nóng theo từng giao dịch thành công (tiền mặt/vàng/xe máy). \nĐược đào tạo bài bản từ A-Z bởi các chuyên gia trong ngành, cơ hội thăng tiến lên cấp Quản lý sau 6-12 tháng làm việc xuất sắc.",
        status: "available"
    },
    {
        job_id: 5,
        job_title: "Kế toán Tổng hợp",
        company_name: "Finance Pro Services",
        closed_date: new Date("2026-02-02"),
        salary: "14,000,000 - 18,000,000 VND",
        area: "Bình Dương",
        experience: "3 năm",
        degree: "Đại học",
        post_user_id: 301,
        status: "available",
        description: "Thực hiện hạch toán các nghiệp vụ kế toán phát sinh hàng ngày (tiền mặt, ngân hàng, công nợ, tài sản cố định). \nLập và đối chiếu các loại báo cáo thuế (GTGT, TNDN, TNCN) theo định kỳ tháng, quý, năm. \nTham gia lập Báo cáo tài chính, báo cáo quản trị nội bộ và phối hợp làm việc với các cơ quan Thuế khi cần thiết.",
        requirements: "Tốt nghiệp chuyên ngành Tài chính - Kế toán từ Đại học trở lên, có ít nhất 3 năm kinh nghiệm làm Kế toán Tổng hợp. \nThành thạo nghiệp vụ kế toán, quy định pháp luật về thuế và sử dụng phần mềm kế toán (ưu tiên thành thạo MISA hoặc SAP). \nCẩn thận, trung thực, có trách nhiệm cao và khả năng làm việc độc lập, chịu được áp lực cao trong mùa báo cáo.",
        benefits: "Lương tháng 13 cố định, được xem xét tăng lương hàng năm theo hiệu quả công việc (performance review). \nDu lịch nghỉ dưỡng hàng năm, khám sức khỏe định kỳ. Phụ cấp ăn trưa, điện thoại và các khoản trợ cấp khác theo quy định công ty. \nCơ hội làm việc trong môi trường chuyên nghiệp, ổn định, với quy trình làm việc rõ ràng và cơ hội phát triển chuyên môn sâu hơn."
    },
    {
        job_id: 6,
        job_title: "Content Marketing Specialist",
        company_name: "Creative Digital Agency",
        closed_date: new Date("2026-02-02"),
        salary: "12,000,000 - 16,000,000 VND",
        area: "Hà Nội",
        experience: "1 năm",
        degree: "Cao đẳng",
        post_user_id: 404,
        status: "available",
        description: "Sáng tạo nội dung đa dạng (bài viết, hình ảnh, video) cho các kênh truyền thông chính: Fanpage Facebook, Website, Zalo. \nLên ý tưởng, kịch bản (storyboard) cho các video ngắn trên TikTok và YouTube Short, nhằm thu hút người xem và tăng tương tác. \nĐo lường, phân tích hiệu quả nội dung theo KPI đã đặt ra và đề xuất các phương án tối ưu hóa.",
        requirements: "Có kinh nghiệm tối thiểu 1 năm làm Content Marketing hoặc vị trí tương đương. Khả năng viết lách, storytelling tốt và sáng tạo không giới hạn. \nCó kiến thức cơ bản về SEO, Digital Marketing và đã từng sử dụng các công cụ thiết kế cơ bản như Canva, CapCut để tự làm hình ảnh/video đơn giản là một lợi thế. \nNăng động, bắt kịp trend nhanh, có khả năng làm việc nhóm và chịu được áp lực deadline.",
        benefits: "Môi trường làm việc năng động, trẻ trung, khuyến khích sự sáng tạo và thử nghiệm cái mới. \nThưởng KPI hấp dẫn theo hiệu quả công việc và các chiến dịch Marketing thành công. \nHỗ trợ chi phí tham gia các khóa học nâng cao kỹ năng (Content, SEO, Video Editing) và thưởng du lịch nước ngoài cho nhân viên xuất sắc."
    },
    {
        job_id: 7,
        job_title: "Chuyên viên Tuyển dụng (HR)",
        company_name: "Talent Hub Vietnam",
        closed_date: new Date("2026-02-02"),
        salary: "14,000,000 - 17,000,000 VND",
        area: "TP. Hồ Chí Minh",
        experience: "2 năm",
        degree: "Đại học",
        post_user_id: 502,
        status: "available",
        description: "Đăng tin tuyển dụng trên các kênh phù hợp, chủ động tìm kiếm (sourcing) và xây dựng Talent Pool (đặc biệt là khối IT/Công nghệ). \nSàng lọc hồ sơ, tổ chức phỏng vấn, đánh giá và đề xuất ứng viên phù hợp với yêu cầu của các phòng ban. \nTham gia vào việc xây dựng thương hiệu tuyển dụng (Employer Branding) và tổ chức các sự kiện tuyển dụng nội bộ/bên ngoài.",
        requirements: "Tốt nghiệp Đại học, có ít nhất 2 năm kinh nghiệm ở vị trí Tuyển dụng (ưu tiên tuyển dụng Mass hoặc tuyển dụng IT). \nCó kỹ năng giao tiếp, đàm phán, và nhìn nhận con người (phỏng vấn hành vi - Behavioral Interview) tốt. \nAm hiểu về Luật Lao động, có kiến thức cơ bản về C&B là một lợi thế.",
        benefits: "Thưởng tuyển dụng theo KPI, Chế độ công đoàn đầy đủ (sinh nhật, hiếu hỷ, lễ Tết). \nĐược làm việc trực tiếp với đội ngũ quản lý cấp cao để xây dựng chiến lược nhân sự. \nLương tháng 13, Bảo hiểm tai nạn 24/7 và các khóa đào tạo chuyên sâu về HR."
    },
    {
        job_id: 8,
        job_title: "Kỹ sư Xây dựng dân dụng",
        company_name: "VietBuild Group",
        closed_date: new Date("2026-02-02"),
        salary: "18,000,000 - 25,000,000 VND",
        area: "Đồng Nai",
        experience: "3-5 năm",
        degree: "Đại học",
        post_user_id: 601,
        status: "available",
        description: "Giám sát thi công các hạng mục công trình xây dựng dân dụng (nhà cao tầng, biệt thự) tại công trường, đảm bảo tuân thủ bản vẽ kỹ thuật và tiêu chuẩn chất lượng. \nBóc tách khối lượng (Quantity Surveying), kiểm tra và xác nhận vật tư, thiết bị sử dụng trên công trường. \nLập báo cáo tiến độ, giải quyết các vấn đề kỹ thuật phát sinh tại hiện trường và phối hợp với các nhà thầu phụ.",
        requirements: "Tốt nghiệp Đại học chuyên ngành Xây dựng Dân dụng và Công nghiệp. Có kinh nghiệm 3-5 năm giám sát công trình. \nChịu được áp lực cao, sẵn sàng đi công trình xa (nếu cần thiết). Sử dụng thành thạo phần mềm chuyên ngành như AutoCAD, MS Project và các phần mềm tính toán kết cấu. \nCó chứng chỉ hành nghề giám sát là một lợi thế.",
        benefits: "Phụ cấp đi lại, Phụ cấp công trình/lưu trú (nếu làm việc xa), thưởng theo tiến độ dự án. \nĐược đóng Bảo hiểm theo luật, chế độ nghỉ phép, nghỉ Lễ/Tết đầy đủ. \nLương tháng 13 và cơ hội thăng tiến rõ ràng lên vị trí Chỉ huy trưởng công trường."
    },
    {
        job_id: 9,
        job_title: "Nhân viên Chăm sóc Khách hàng",
        company_name: "Customer Connect",
        closed_date: new Date("2026-02-02"),
        salary: "7,000,000 - 9,000,000 VND",
        area: "Cần Thơ",
        experience: "Dưới 1 năm",
        degree: "Trung cấp",
        post_user_id: 703,
        description: "Trực tổng đài (Call Center) hoặc các kênh online (Chat/Email), tiếp nhận và giải đáp các thắc mắc, khiếu nại của khách hàng về sản phẩm/dịch vụ. \nGhi nhận thông tin, phân loại và chuyển tiếp các trường hợp phức tạp đến bộ phận liên quan để xử lý kịp thời. \nThực hiện các cuộc gọi khảo sát sự hài lòng của khách hàng và cập nhật dữ liệu khách hàng vào hệ thống CRM.",
        requirements: "Tốt nghiệp Trung cấp trở lên, không yêu cầu kinh nghiệm (sẽ được đào tạo). \nGiọng nói dễ nghe, truyền cảm, có khả năng giao tiếp lưu loát và kỹ năng xử lý tình huống linh hoạt. \nKiên nhẫn, hòa nhã, có tinh thần trách nhiệm cao và mong muốn gắn bó lâu dài với công việc chăm sóc khách hàng.",
        benefits: "Làm việc theo ca linh hoạt (xoay ca), Thưởng chuyên cần, và thưởng theo chất lượng cuộc gọi/độ hài lòng của khách hàng (CSAT). \nĐược đóng Bảo hiểm đầy đủ ngay sau khi ký hợp đồng chính thức, có cơ hội làm việc trong môi trường chuyên nghiệp, thân thiện. \nLộ trình phát triển rõ ràng lên các vị trí Team Leader/Supervisor trong ngành Dịch vụ khách hàng.",
        status: "available"
    },
    {
        job_id: 10,
        job_title: "Phiên dịch viên tiếng Nhật (N2)",
        company_name: "Japan Tech Hub",
        closed_date: new Date("2026-02-02"),
        salary: "20,000,000 - 25,000,000 VND",
        area: "Hải Phòng",
        experience: "Không yêu cầu",
        degree: "Đại học",
        post_user_id: 808,
        description: "Phiên dịch (Consecutive/Simultaneous) trong các cuộc họp, đàm phán kinh doanh, và các buổi gặp gỡ giữa quản lý Việt Nam và chuyên gia Nhật Bản. \nDịch thuật các tài liệu kỹ thuật, hợp đồng, văn bản hành chính từ tiếng Nhật sang tiếng Việt và ngược lại, đảm bảo độ chính xác cao. \nHỗ trợ các chuyên gia Nhật Bản trong công việc và cuộc sống hàng ngày tại Việt Nam.",
        requirements: "Trình độ tiếng Nhật N2 trở lên (bắt buộc, có chứng chỉ JLPT). Tốt nghiệp Đại học chuyên ngành Ngôn ngữ Nhật hoặc các ngành liên quan. \nCó kỹ năng phiên dịch và dịch thuật tốt, ưu tiên ứng viên biết thêm tiếng Anh (TOEIC 700+). \nThái độ làm việc chuyên nghiệp, cẩn thận, bảo mật thông tin và có khả năng làm việc dưới áp lực thời gian.",
        benefits: "Xe đưa đón từ nội thành (tuyến cố định), Trợ cấp tiếng Nhật hàng tháng (nếu có N1), và Phụ cấp ăn trưa. \nCơ hội được cử đi Đào tạo chuyên môn ngắn hạn/dài hạn tại Nhật Bản (chi phí do công ty chi trả). \nLương tháng 13, bảo hiểm sức khỏe và môi trường làm việc chuẩn Nhật Bản (kỷ luật, chuyên nghiệp).",
        status: "available"
    },
    // ====== JOB 11 → 20 (IT / DEV) ======
    {
        job_id: 11,
        job_title: "Junior Backend Developer (Node.js)",
        company_name: "Startup Code",
        closed_date: new Date("2026-02-02"),
        salary: "15,000,000 - 20,000,000 VND",
        area: "Hà Nội",
        experience: "Dưới 1 năm",
        degree: "Đại học",
        post_user_id: 901,
        description: "Tham gia vào việc phát triển các tính năng mới cho hệ thống backend với Node.js, Express, và cơ sở dữ liệu MongoDB/PostgreSQL. \nViết các API tuân thủ chuẩn RESTful, đảm bảo tính bảo mật và hiệu suất cao. \nThực hiện sửa lỗi (bug fixing) và tối ưu hóa code dưới sự hướng dẫn của Senior Developer.",
        requirements: "Nắm vững kiến thức cơ bản về JavaScript/TypeScript, đã từng làm dự án cá nhân hoặc đồ án với Node.js và Express. \nBiết sử dụng Git, hiểu về Database (MongoDB/SQL), và có kiến thức về REST API. \nCó tư duy logic tốt, khả năng tự học hỏi nhanh và mong muốn phát triển chuyên sâu về Backend.",
        benefits: "Đào tạo bài bản theo lộ trình 3-6 tháng, có Mentor trực tiếp hướng dẫn kỹ thuật. \nLộ trình thăng tiến rõ ràng lên Mid-level sau 1-1.5 năm. \nPhụ cấp ăn trưa, trà chiều miễn phí, môi trường startup trẻ, năng động.",
        status: "available"
    },
    {
        job_id: 12,
        job_title: "Fullstack Developer (React + Node)",
        company_name: "Mega Software",
        closed_date: new Date("2026-02-02"),
        salary: "30,000,000 - 40,000,000 VND",
        area: "TP. Hồ Chí Minh",
        experience: "2-4 năm",
        degree: "Đại học",
        post_user_id: 902,
        description: "Phát triển toàn diện hệ thống web (end-to-end) từ Frontend (ReactJS) đến Backend (Node.js/TypeScript). \nThiết kế, xây dựng và quản lý các API, đảm bảo tích hợp thông suốt giữa các module hệ thống. \nViết Unit Test, Integration Test và tham gia vào quá trình DevOps (triển khai, giám sát hệ thống).",
        requirements: "Kinh nghiệm 2-4 năm làm Fullstack/Software Engineer. Thành thạo ReactJS và Node.js. \nCó kiến thức tốt về cơ sở dữ liệu SQL (MySQL/PostgreSQL) và NoSQL (MongoDB). \nCó kinh nghiệm làm việc với Cloud Services (AWS/Azure/GCP) và CI/CD là một điểm cộng lớn.",
        benefits: "Chính sách làm việc Remote 2 ngày/tuần linh hoạt, thưởng hiệu suất hàng quý và cuối năm (lên đến 4 tháng lương). \nĐược cấp thiết bị làm việc cao cấp, Phụ cấp điện thoại, internet hàng tháng. \nBảo hiểm sức khỏe cá nhân, Teambuilding thường xuyên, và cơ hội tham gia các dự án công nghệ lớn.",
        status: "available"
    },
    {
        job_id: 13,
        job_title: "Mobile Developer (React Native)",
        company_name: "App Innovator",
        closed_date: new Date("2026-02-02"),
        salary: "25,000,000 - 35,000,000 VND",
        area: "Đà Nẵng",
        experience: "1-3 năm",
        degree: "Cao đẳng/Đại học",
        post_user_id: 903,
        description: "Phát triển và duy trì các ứng dụng mobile đa nền tảng (iOS, Android) bằng React Native. \nĐảm bảo ứng dụng có hiệu suất cao, giao diện người dùng đẹp và trải nghiệm mượt mà. \nKhắc phục lỗi, tối ưu hóa code và làm việc với các native modules khi cần thiết.",
        requirements: "Có kinh nghiệm 1-3 năm với React Native. Nắm vững Redux/Redux Toolkit hoặc các thư viện tương tự. \nHiểu biết về quy trình release ứng dụng lên App Store và Google Play. \nƯu tiên ứng viên có kiến thức về Native Development (Swift/Kotlin/Java) là một lợi thế.",
        benefits: "Được cấp thiết bị làm việc Macbook, môi trường trẻ trung, sáng tạo và không gian làm việc mở. \nThưởng theo dự án và thưởng cuối năm, Lương tháng 13. \nChế độ nghỉ phép hàng năm 14 ngày, khám sức khỏe định kỳ và tham gia các hoạt động thể thao nội bộ.",
        status: "available"
    },
    {
        job_id: 14,
        job_title: "DevOps Engineer (AWS)",
        company_name: "Cloud Solutions",
        closed_date: new Date("2026-02-02"),
        salary: "40,000,000 - 55,000,000 VND",
        area: "Hà Nội",
        experience: "3-5 năm",
        degree: "Đại học",
        post_user_id: 904,
        description: "Thiết kế, triển khai và quản lý các quy trình CI/CD tự động (Gitlab CI/Jenkins/ArgoCD) để tối ưu hóa quá trình phát hành phần mềm. \nQuản lý, giám sát và tối ưu hóa hạ tầng đám mây (AWS/GCP), sử dụng IaC (Terraform/Ansible). \nĐảm bảo tính ổn định, bảo mật và khả năng mở rộng của hệ thống Production.",
        requirements: "Kinh nghiệm 3-5 năm làm DevOps/SRE. Chuyên sâu về AWS (EC2, S3, RDS, EKS/ECS) hoặc các nền tảng Cloud khác. \nThành thạo Docker, Kubernetes, Prometheus/Grafana, và có khả năng viết script (Shell, Python). \nHiểu sâu về Networking, Security và hệ điều hành Linux.",
        benefits: "Mức lương và gói quyền lợi cao nhất thị trường, Thưởng dự án và thưởng hiệu suất cực kỳ hấp dẫn. \nBảo hiểm cao cấp PVI cho cả gia đình, các khoản trợ cấp chứng chỉ quốc tế. \nĐược tài trợ tham gia các hội nghị Cloud/DevOps lớn trên thế giới và làm việc với các chuyên gia hàng đầu.",
        status: "available"
    },
    {
        job_id: 15,
        job_title: "QA Manual Tester",
        company_name: "Test Masters",
        closed_date: new Date("2026-02-02"),
        salary: "12,000,000 - 18,000,000 VND",
        area: "Cần Thơ",
        experience: "1 năm",
        degree: "Cao đẳng",
        post_user_id: 905,
        description: "Thực hiện kiểm thử thủ công (Manual Test) cho các ứng dụng web và mobile (iOS/Android) theo các Test Plan đã được phê duyệt. \nViết và duy trì Test Case, Test Scenario dựa trên yêu cầu nghiệp vụ. \nBáo cáo, theo dõi và xác nhận lại lỗi (bug) trên hệ thống quản lý lỗi (Jira).",
        requirements: "Có kinh nghiệm tối thiểu 1 năm làm QA/Tester. Biết viết Test Case rõ ràng, chi tiết và có tư duy logic, phản biện tốt. \nCó kiến thức cơ bản về SQL để kiểm tra dữ liệu và sử dụng thành thạo các công cụ Test cơ bản. \nCẩn thận, tỉ mỉ, có trách nhiệm và khả năng làm việc độc lập dưới áp lực deadline.",
        benefits: "Thưởng theo dự án và thưởng cuối năm, chế độ nghỉ phép, nghỉ Lễ/Tết đầy đủ. \nPhụ cấp ăn trưa, gửi xe. Môi trường làm việc thân thiện, có cơ hội được đào tạo để chuyển sang Automation Test. \nLương tháng 13 và các quyền lợi theo Luật Lao động Việt Nam.",
        status: "available"
    },
    {
        job_id: 16,
        job_title: "Data Analyst",
        company_name: "Data Driven Co.",
        closed_date: new Date("2026-02-02"),
        salary: "30,000,000 - 40,000,000 VND",
        area: "TP. Hồ Chí Minh",
        experience: "2-3 năm",
        degree: "Đại học",
        post_user_id: 906,
        description: "Thực hiện thu thập, làm sạch và phân tích dữ liệu kinh doanh từ nhiều nguồn khác nhau để tìm ra Insight có giá trị. \nXây dựng các Dashboard báo cáo (Power BI/Tableau) trực quan để theo dõi hiệu suất hoạt động của các phòng ban. \nĐưa ra các đề xuất chiến lược dựa trên dữ liệu để tối ưu hóa quy trình kinh doanh và tăng trưởng doanh thu.",
        requirements: "Tốt nghiệp Đại học, có 2-3 năm kinh nghiệm làm Data Analyst/Business Analyst. \nThành thạo truy vấn dữ liệu phức tạp bằng SQL, và sử dụng Power BI/Tableau để visualize data. \nCó kinh nghiệm sử dụng Python (Pandas, NumPy) hoặc R để phân tích nâng cao là một lợi thế lớn.",
        benefits: "Thưởng KPI hấp dẫn theo hiệu quả công việc và kết quả của các phân tích. \nĐược tài trợ các khóa đào tạo nâng cao về Data Science, Machine Learning. \nLàm việc trong môi trường tập trung vào dữ liệu (Data Driven Culture), trang bị thiết bị làm việc hiện đại.",
        status: "available"
    },
    {
        job_id: 17,
        job_title: "Software Engineer (Java)",
        company_name: "Enterprise Systems",
        closed_date: new Date("2026-02-02"),
        salary: "25,000,000 - 35,000,000 VND",
        area: "Bắc Ninh",
        experience: "2 năm",
        degree: "Đại học",
        post_user_id: 907,
        description: "Phát triển và duy trì các hệ thống backend cho ứng dụng Enterprise sử dụng ngôn ngữ Java. \nLàm việc với Spring Boot, Spring Cloud, và kiến trúc Microservices. \nTham gia vào quá trình code review, tối ưu hóa performance của các dịch vụ hiện có.",
        requirements: "Có kinh nghiệm 2 năm với Java và các Framework như Spring Boot/Spring MVC. \nNắm vững OOP, Design Patterns và SQL/Hibernate. \nƯu tiên ứng viên có kinh nghiệm làm việc với Kafka/RabbitMQ.",
        benefits: "Xe đưa đón từ Hà Nội/các khu vực lân cận. Phụ cấp ăn trưa và chế độ phúc lợi tốt (quà tặng dịp Lễ/Tết). \nLương tháng 13, thưởng dự án theo quý. \nCơ hội làm việc và được đào tạo về các giải pháp Enterprise hàng đầu thế giới.",
        status: "available"
    },
    {
        job_id: 18,
        job_title: "IT Support",
        company_name: "Service Desk",
        closed_date: new Date("2026-02-02"),
        salary: "10,000,000 - 15,000,000 VND",
        area: "Huế",
        experience: "Không yêu cầu",
        degree: "Cao đẳng",
        post_user_id: 908,
        description: "Hỗ trợ kỹ thuật kịp thời cho nhân viên về các vấn đề liên quan đến phần cứng (máy tính, máy in), phần mềm (Windows, Office) và hệ thống mạng nội bộ. \nCài đặt, bảo trì và quản lý tài sản IT của công ty. \nThực hiện các công việc hành chính IT khác theo yêu cầu của cấp trên.",
        requirements: "Tốt nghiệp Cao đẳng trở lên, không yêu cầu kinh nghiệm (chấp nhận sinh viên mới ra trường có kiến thức vững). \nHiểu biết về phần cứng máy tính, hệ điều hành Windows/MacOS và cấu hình mạng cơ bản (LAN, Wifi). \nNhanh nhẹn, nhiệt tình, có trách nhiệm và khả năng giao tiếp tốt.",
        benefits: "Làm việc giờ hành chính (thứ 2 - thứ 6), cuối tuần nghỉ. \nLương tháng 13, Bảo hiểm xã hội đầy đủ. \nĐược đào tạo thêm về quản trị hệ thống cơ bản.",
        status: "available"
    },
    {
        job_id: 19,
        job_title: "Game Developer (Unity)",
        company_name: "Gaming Studio VN",
        closed_date: new Date("2026-02-02"),
        salary: "24,000,000 - 32,000,000 VND",
        area: "TP. Hồ Chí Minh",
        experience: "1-2 năm",
        degree: "Đại học",
        post_user_id: 909,
        description: "Phát triển các tính năng, cơ chế gameplay và giao diện người dùng cho các dự án game mobile (Hyper-casual/Casual) bằng Unity. \nViết code sạch, tối ưu hóa hiệu suất (frame rate, memory usage) và sửa lỗi trong quá trình phát triển. \nHợp tác chặt chẽ với đội ngũ Designer và Artist để đưa ý tưởng thành sản phẩm game hoàn chỉnh.",
        requirements: "Có kinh nghiệm 1-2 năm phát triển game với Unity3D. Thành thạo ngôn ngữ lập trình C#. \nHiểu biết về các khái niệm Game Development (Physics, AI, Animation, UI/UX). \nCó các sản phẩm game đã hoàn thành hoặc có sẵn trên Store là một lợi thế.",
        benefits: "Thưởng sản phẩm theo lợi nhuận thu được, Lương tháng 13. \nKhông gian làm việc sáng tạo, được chơi game thoải mái trong giờ giải lao. \nCơ hội được tham gia các sự kiện Game Development lớn trong và ngoài nước.",
        status: "available"
    },
    {
        job_id: 20,
        job_title: "AI Engineer",
        company_name: "Innovation Labs",
        closed_date: new Date("2026-02-02"),
        salary: "45,000,000 - 60,000,000 VND",
        area: "Hà Nội",
        experience: "3-5 năm",
        degree: "Đại học",
        post_user_id: 910,
        description: "Nghiên cứu, phát triển và triển khai các mô hình Trí tuệ Nhân tạo (AI), Học máy (Machine Learning), và Học sâu (Deep Learning) vào các sản phẩm cốt lõi của công ty. \nThu thập, tiền xử lý dữ liệu lớn, đánh giá hiệu suất của mô hình và tối ưu hóa chúng cho môi trường Production. \nTham gia vào việc công bố các bài báo khoa học và các dự án nghiên cứu chuyên sâu.",
        requirements: "Có bằng Thạc sĩ/Tiến sĩ hoặc kinh nghiệm 3-5 năm làm AI Engineer/Data Scientist. \nThành thạo Python và các thư viện chuyên dụng như TensorFlow, PyTorch, Scikit-learn. \nKinh nghiệm làm việc với các thuật toán CV (Computer Vision) hoặc NLP (Natural Language Processing) là bắt buộc.",
        benefits: "Mức lương và gói quyền lợi cực kỳ cao, Lương tháng 13 + Thưởng nghiên cứu khoa học. \nĐược tài trợ 100% chi phí tham gia các hội nghị AI quốc tế. \nMôi trường nghiên cứu chuyên sâu, được cấp ngân sách lớn cho các dự án đột phá.",
        status: "available"
    },

    // ====== JOB 21 → 30 (NGÀNH KHÁC) ======
    {
        job_id: 21,
        job_title: "Nhân viên Bán hàng",
        company_name: "Retail Pro",
        closed_date: new Date("2026-02-02"),
        salary: "9,000,000 VND + Hoa Hồng",
        area: "Quảng Ninh",
        experience: "Không yêu cầu",
        degree: "Trung cấp",
        post_user_id: 911,
        description: "Đón tiếp, tư vấn và giới thiệu sản phẩm/dịch vụ trực tiếp cho khách hàng tại cửa hàng. \nSắp xếp, trưng bày hàng hóa và quản lý khu vực bán hàng gọn gàng, sạch sẽ. \nPhối hợp với thu ngân và quản lý cửa hàng để hoàn thành chỉ tiêu doanh số.",
        requirements: "Tốt nghiệp Trung cấp trở lên, không yêu cầu kinh nghiệm (sẽ được đào tạo nghiệp vụ). \nCó khả năng giao tiếp, thái độ phục vụ tốt, nhiệt tình và trung thực. \nƯu tiên ứng viên có thể làm việc theo ca linh hoạt (ca sáng/chiều).",
        benefits: "Mức lương cơ bản ổn định (9,000,000 VND) và Hoa hồng doanh số hấp dẫn theo hiệu quả bán hàng. \nChế độ bảo hiểm, nghỉ phép đầy đủ theo Luật Lao động. \nĐược đào tạo kỹ năng bán hàng chuyên nghiệp và có cơ hội lên Quản lý cửa hàng.",
        status: "available"
    },
    {
        job_id: 22,
        job_title: "Marketing Executive",
        company_name: "Media Solutions",
        closed_date: new Date("2026-02-02"),
        salary: "15,000,000 - 20,000,000 VND",
        area: "Đà Nẵng",
        experience: "1-2 năm",
        degree: "Đại học",
        post_user_id: 912,
        description: "Lập kế hoạch và triển khai các chiến dịch Marketing tổng thể (Digital và Offline) theo mục tiêu kinh doanh của công ty. \nQuản lý và tối ưu hóa các kênh quảng cáo trực tuyến (Google Ads, Facebook Ads). \nĐo lường, báo cáo hiệu suất của chiến dịch, và quản lý ngân sách Marketing.",
        requirements: "Tốt nghiệp Đại học chuyên ngành Marketing/Kinh tế. Có 1-2 năm kinh nghiệm thực tế trong lĩnh vực Digital Marketing. \nNắm vững kiến thức về SEO, Google Analytics, Facebook Ads. \nCó tư duy phân tích, sáng tạo và khả năng làm việc nhóm tốt.",
        benefits: "Thưởng chiến dịch theo kết quả đạt được, Lương tháng 13. \nMôi trường làm việc chuyên nghiệp, có cơ hội làm việc với các đối tác truyền thông lớn. \nĐược công ty tài trợ tham gia các khóa học nâng cao chuyên môn Marketing.",
        status: "available"
    },
    {
        job_id: 23,
        job_title: "Nhân viên Kho",
        company_name: "Logistics Fast",
        closed_date: new Date("2026-02-02"),
        salary: "8,000,000 - 10,000,000 VND",
        area: "Bình Dương",
        experience: "Không yêu cầu",
        degree: "Trung cấp",
        post_user_id: 913,
        description: "Thực hiện quản lý, sắp xếp hàng hóa trong kho theo đúng quy tắc và tiêu chuẩn. \nKiểm tra số lượng, chất lượng hàng hóa khi nhập/xuất kho, đảm bảo khớp với chứng từ. \nThực hiện các báo cáo tồn kho định kỳ và các công việc khác theo sự phân công của quản lý kho.",
        requirements: "Tốt nghiệp Trung cấp trở lên, không yêu cầu kinh nghiệm (ưu tiên đã từng làm kho vận/logistics). \nCẩn thận, trung thực, có sức khỏe tốt và có thể làm việc theo ca. \nBiết sử dụng máy tính cơ bản để nhập liệu.",
        benefits: "Phụ cấp ca đêm (nếu có), Phụ cấp ăn ca, và các chế độ bảo hiểm đầy đủ. \nLương tháng 13, thưởng Tết hấp dẫn. \nCơ hội thăng tiến lên vị trí Tổ trưởng/Quản lý kho.",
        status: "available"
    },
    {
        job_id: 24,
        job_title: "Lễ tân Khách sạn",
        company_name: "Luxury Hotel VN",
        closed_date: new Date("2026-02-02"),
        salary: "10,000,000 - 14,000,000 VND",
        area: "Nha Trang",
        experience: "1 năm",
        degree: "Cao đẳng",
        post_user_id: 1,
        description: "Thực hiện quy trình check-in, check-out cho khách hàng một cách nhanh chóng và chuyên nghiệp. \nTiếp đón, giải đáp các thắc mắc và xử lý các yêu cầu/khiếu nại của khách hàng trong suốt thời gian lưu trú. \nPhối hợp với các bộ phận khác (Buồng phòng, F&B) để đảm bảo dịch vụ tốt nhất.",
        requirements: "Tốt nghiệp Cao đẳng chuyên ngành Du lịch/Khách sạn. Có kinh nghiệm 1 năm ở vị trí tương đương. \nBắt buộc phải giao tiếp tiếng Anh lưu loát (nghe, nói), ưu tiên biết thêm ngôn ngữ thứ hai. \nNgoại hình sáng, thái độ phục vụ chuyên nghiệp, nhiệt tình và có khả năng làm việc theo ca.",
        benefits: "Mức lương cạnh tranh, có thêm Tip và Service Charge hàng tháng. \nĐược cung cấp đồng phục, bữa ăn giữa ca. \nCơ hội được đào tạo các kỹ năng nghiệp vụ khách sạn 5 sao, lộ trình thăng tiến rõ ràng.",
        status: "available"
    },
    {
        job_id: 25,
        job_title: "Nhân viên Hành chính",
        company_name: "Office Support Co.",
        closed_date: new Date("2026-02-02"),
        salary: "12,000,000 - 15,000,000 VND",
        area: "Hà Nội",
        experience: "1-2 năm",
        degree: "Đại học",
        post_user_id: 1,
        description: "Soạn thảo, lưu trữ và quản lý các loại văn bản, hồ sơ hành chính của công ty. \nQuản lý văn phòng phẩm, thiết bị, tài sản và thực hiện các công việc mua sắm, thanh toán theo quy trình. \nHỗ trợ tổ chức các cuộc họp, sự kiện nội bộ và các công việc khác theo yêu cầu của Ban Lãnh đạo.",
        requirements: "Tốt nghiệp Đại học, có 1-2 năm kinh nghiệm làm Hành chính/Văn thư. \nThành thạo tin học văn phòng (Word, Excel, PowerPoint) và có kỹ năng sắp xếp công việc tốt. \nCẩn thận, tỉ mỉ, có khả năng làm việc nhóm và giao tiếp hiệu quả.",
        benefits: "Làm việc giờ hành chính (8h00 - 17h00), nghỉ thứ 7, Chủ nhật. \nLương tháng 13, Bảo hiểm tai nạn, khám sức khỏe định kỳ. \nMôi trường làm việc ổn định, thân thiện và có cơ hội học hỏi về các nghiệp vụ HR/Admin.",
        status: "available"
    }
];

        // đảm bảo mỗi job có trường `status` và set closed_date để hết hạn
        // - mặc định status: 'available'
    // - job_id 5,6 => 'waitting'
        // - job_id 7,8 => 'delete'
        // - job_id 13,14 => 'outdate'
       rawJobs.forEach(j => {
    // Nếu job_id nằm trong khoảng từ 1 đến 10, set status là 'waiting'
    if (j.job_id >= 1 && j.job_id <= 10) {
        j.status = 'waiting';
    } 
    else if (j.job_id === 11 || j.job_id === 12) {
        j.status = 'deleted';
    } 
    else if (j.job_id === 13 || j.job_id === 14) {
        j.status = 'outdated';
    } 
    else {
        j.status = 'available';
    }
});

        console.log(`⏳ Đang bắt đầu chèn ${rawJobs.length} công việc mới...`);

    // ==============================================
    // 💥 BƯỚC 2: CHÈN TẤT CẢ DỮ LIỆU MỚI
    // ==============================================

    // Sử dụng insertMany để chèn nhanh hơn sau khi đã xóa toàn bộ
    // Tuy nhiên, để đảm bảo tính tường minh của job_id, ta vẫn dùng loop.
    for (const job of rawJobs) {
      await Job.create(job); // Dùng create thay vì findOneAndUpdate/upsert sau khi đã deleteMany
      console.log(`-> Đã chèn job: ${job.job_id}: ${job.job_title}`);
    }

    console.log("\n=============================================");
    console.log("✅ Quá trình Seeding (Xóa cũ & Chèn mới) HOÀN TẤT!");
    console.log("=============================================");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Lỗi trong quá trình seeding:", error);
    if (mongoose.connection.readyState === 1) {
        mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedJobs();