const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");
// const Log = require("../models/Log");

// Lấy thống kê tổng quan
router.get("/stats", async (req, res) => {
  try {
    const [classesCount, quizzesCount, questionsCount, usersCount] =
      await Promise.all([
        Class.countDocuments(),
        Quiz.countDocuments(),
        Question.countDocuments(),
        User.countDocuments(),
      ]);

    res.status(200).json({
      classes: classesCount,
      quizzes: quizzesCount,
      questions: questionsCount,
      users: usersCount,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// API lấy hoạt động gần đây
router.get("/recent-activities", async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("userId", "name email") // Lấy thông tin người dùng
      .sort({ timestamp: -1 }) // Sắp xếp theo thời gian mới nhất
      .limit(10); // Giới hạn số lượng hoạt động

    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching recent activities:", err);
    res.status(500).json({ message: "Failed to fetch recent activities" });
  }
});
module.exports = router;
