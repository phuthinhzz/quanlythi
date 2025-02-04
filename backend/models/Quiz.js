const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    duration: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "InProgress", "Completed"],
      default: "Draft",
    },
    settings: {
      requireCamera: {
        type: Boolean,
        default: true,
      },
      requireFullscreen: {
        type: Boolean,
        default: true,
      },
      notallowTabChange: {
        type: Boolean,
        default: false,
      },
      shuffleQuestions: {
        type: Boolean,
        default: false,
      },
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);
