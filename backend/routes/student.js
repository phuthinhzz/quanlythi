const express = require("express");
const studentController = require("../controllers/studentController");
const middlewareController = require("../controllers/middlewareController");
const router = express.Router();

// Sinh viên bắt đầu bài thi
router.post(
  "/quiz/:quizId/start",
  middlewareController.verifyToken,
  studentController.startQuiz
);
router.post(
  "/create-student-quiz",
  middlewareController.verifyToken,
  studentController.createStudentQuiz
);

// Nộp bài thi
router.post(
  "/quiz/:id/submit",
  middlewareController.verifyToken,
  studentController.submitQuiz
);
router.get(
  "/student-quiz",
  middlewareController.verifyToken,
  studentController.getAllStudentQuiz
);

module.exports = router;
