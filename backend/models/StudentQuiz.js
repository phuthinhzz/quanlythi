const mongoose = require("mongoose");

const studentQuizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizzes: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
          required: true,
        },
        startTime: {
          type: Date,
        },
        endTime: {
          type: Date,
          validate: {
            validator: function (value) {
              return this.startTime < value;
            },
            message: "End time must be greater than start time",
          },
        },
        score: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["NotStarted", "InProgress", "Submitted", "Terminated"],
          default: "NotStarted",
        },
        monitoringData: {
          cameraEnabled: {
            type: Boolean,
            default: false,
          },
          isFullscreen: {
            type: Boolean,
            default: false,
          },
          tabSwitchCount: {
            type: Number,
            default: 0,
          },
          violations: [
            {
              type: {
                type: String,
                enum: ["CameraOff", "FullscreenExit", "TabSwitch"],
              },
              timestamp: Date,
              description: String,
            },
          ],
        },
        ipAddress: String,
        userAgent: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentQuiz", studentQuizSchema);
