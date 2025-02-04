const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    points: {
      type: Number,
      required: true,
      default: 1,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    category: {
      type: String, // Phân loại câu hỏi
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timeLimit: {
      type: Number, // Thời gian làm câu hỏi (giây)
      default: 60,
    },
    explanation: {
      type: String, // Giải thích đáp án
    },
    usage: {
      usedCount: {
        type: Number,
        default: 0,
      },
      correctCount: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
