const mongoose = require("mongoose");

// Schema lưu trữ thông tin người dùng
const userSchema = new mongoose.Schema(
  {
    mssv: {
      type: String, // Mã số sinh viên
      require: true,
      minlength: 1,
      unique: true, // Không cho phép trùng MSSV
    },
    email: {
      type: String, // Email của người dùng
      require: true,
      minlength: 1,
      unique: true, // Không cho phép trùng email
    },
    name: {
      type: String, // Tên người dùng
      minlength: 1,
      require: true,
    },
    password: {
      type: String, // Mật khẩu
      require: true,
      minlength: 1,
    },
    admin: {
      type: Boolean, // Phân quyền (true nếu là admin)
      default: false,
    },
  },
  { timestamps: true } // Tự động lưu thời gian tạo và cập nhật
);

module.exports = mongoose.model("User", userSchema);
