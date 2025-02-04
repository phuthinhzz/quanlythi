const express = require("express");
const quizController = require("../controllers/quizController");
const middlewareController = require("../controllers/middlewareController");
const router = express.Router();

// Tạo bài thi mới
router.post(
  "/",
  middlewareController.verifyAdmin,
  quizController.createQuiz
);


// Lấy danh sách bài thi theo lớp
router.get(
  "/class/:classId",
  middlewareController.verifyToken,
  quizController.getQuizzesByClass
);
router.get(
  "/get-all/:id",
  middlewareController.verifyToken,
  quizController.getQuizzesById
);
router.get(
  "/",
  middlewareController.verifyToken,
  quizController.getAllQuizzes
);

// Thêm câu hỏi vào bài thi
router.post(
  "/add-questions",
  middlewareController.verifyAdmin,
  quizController.addQuestionsToQuiz
);

// Xóa bài thi
router.delete(
  "/:id",
  middlewareController.verifyAdmin,
  quizController.deleteQuiz
);

router.get(
  "/:classId/random-quiz",
  middlewareController.verifyToken,
  quizController.randomQuiz
);
router.get(
  "/:id",
  middlewareController.verifyAdmin,
  quizController.getQuizById
);
router.get(
  "/allquiz/all",
  middlewareController.verifyAdmin,
  quizController.getAllQuizzesNotQuery
);
router.get(
  "/allquiz/class-name",
  middlewareController.verifyAdmin,
  quizController.getAllQuizzesWithClassName
);
router.post(
  "/update-status",
  middlewareController.verifyAdmin,
  quizController.updateQuizStatus
);
router.put(
  "/:id",
  middlewareController.verifyAdmin,
  quizController.updateQuiz
);

module.exports = router;
