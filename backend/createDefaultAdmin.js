// createDefaultAdmin.js
const bcrypt = require("bcrypt");
const User = require("./models/User");

const createDefaultAdmin = async () => {
  try {
    // Kiểm tra xem đã có admin nào chưa
    const adminExists = await User.findOne({ admin: true });

    if (!adminExists) {
      // Tạo mật khẩu mặc định và hash
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin", salt);

      // Tạo admin mặc định
      const defaultAdmin = await User.create({
        mssv: "admin",
        email: "admin@example.com",
        name: "System Admin",
        password: hashedPassword,
        admin: true,
      });

      console.log("Default admin account created successfully:", {
        mssv: defaultAdmin.mssv,
        email: defaultAdmin.email,
        password: "admin", // Hiển thị mật khẩu mặc định để admin đầu tiên có thể đăng nhập
      });
    } else {
      console.log("Admin account already exists");
    }
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};

module.exports = createDefaultAdmin;
