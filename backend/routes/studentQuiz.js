const express = require("express");
const quizController = require("../controllers/quizController");
const middlewareController = require("../controllers/middlewareController");
const router = express.Router();

// Tạo bài thi mới
router.get(
  "/all-quiz",
  middlewareController.verifyUserAuth,
  quizController.getAllQuizzesNotQuery
);
router.get(
  "/all-student-quiz",
  middlewareController.verifyUserAuth,
  quizController.getStudentQuizByUserId
);

router.post(
  "/start/:id",
  middlewareController.verifyUserAuth,
  quizController.startQuiz
);
module.exports = router;
