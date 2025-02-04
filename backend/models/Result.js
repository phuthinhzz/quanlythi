const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    totalMarks: {
      type: Number,  // Tổng điểm của quiz
      required: true,
    },
    marksObtained: {
      type: Number,  // Điểm đã đạt được
      required: true,
    },
    status: {
      type: String,
      enum: ["Passed", "Failed"],
      required: true,
    },
    submissionDetails: {
      startTime: Date,
      endTime: Date,
      timeSpent: Number,  // Tổng thời gian làm bài (phút)
      submittedBy: {
        type: String,
        enum: ["Student", "System", "Admin"],
        default: "Student",
      },
    },
    violationSummary: {
      cameraViolations: Number,
      fullscreenViolations: Number,
      tabSwitchViolations: Number,
      totalViolations: Number,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOption: String,
        isCorrect: Boolean,
        timeSpent: Number,  // Thời gian làm câu hỏi (giây)
        points: Number,  // Điểm câu hỏi
      },
    ],
    feedback: {
      comment: String,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
    },
  },
  { timestamps: true }
);

// Middleware để tự động tính toán trạng thái đậu/rớt
resultSchema.pre("save", function (next) {
  // Tính trạng thái đậu/rớt
  this.status =
    this.marksObtained >= this.totalMarks * 0.5 ? "Passed" : "Failed";

  // Tính tổng số vi phạm
  if (this.violationSummary) {
    this.violationSummary.totalViolations =
      (this.violationSummary.cameraViolations || 0) +
      (this.violationSummary.fullscreenViolations || 0) +
      (this.violationSummary.tabSwitchViolations || 0);
  }

  next();
});

module.exports = mongoose.model("Result", resultSchema);
