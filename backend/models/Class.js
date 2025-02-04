const mongoose = require("mongoose");

// Schema lưu trữ thông tin lớp học
const classSchema = new mongoose.Schema(
  {
    name: {
      type: String, // Tên lớp học (ví dụ: "Toán 101")
      required: true,
      unique: true, // Không cho phép trùng tên lớp
    },
    startTime: {
      type: Date, // Thời gian bắt đầu lớp học
      required: true,
    },
    endTime: {
      type: Date, // Thời gian kết thúc lớp học
      required: true,
      validate: {
        // Bảo đảm thời gian kết thúc lớn hơn thời gian bắt đầu
        validator: function (value) {
          return this.startTime < value;
        },
        message: "End time must be greater than start time",
      },
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId, // Danh sách sinh viên tham gia lớp
        ref: "User",
      },
    ],
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId, // Danh sách bài kiểm tra của lớp
        ref: "Quiz",
      },
    ],
  },
  { timestamps: true } // Tự động lưu thời gian tạo và cập nhật
);

module.exports = mongoose.model("Class", classSchema);
