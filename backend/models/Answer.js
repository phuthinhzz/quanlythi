const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
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
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOption: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeSpent: {
      type: Number, // Thời gian làm câu hỏi (giây)
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    changeCount: {
      type: Number, // Số lần thay đổi đáp án
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Answer", answerSchema);
