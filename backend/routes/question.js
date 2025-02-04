const express = require("express");
const questionController = require("../controllers/questionController");
const middlewareController = require("../controllers/middlewareController");
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn file 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return cb(new Error("Only .xlsx files are allowed"));
    }
    cb(null, true);
  },
});
const router = express.Router();

// Tạo câu hỏi mới
router.post(
  "/",
  middlewareController.verifyAdmin,
  questionController.createQuestion
);

// Lấy danh sách câu hỏi theo danh mục
router.get(
  "/",
  middlewareController.verifyToken,
  questionController.getQuestionsByCategory
);
router.get(
  "/",
  middlewareController.verifyToken,
  questionController.getAllQuestionsNotQuery
);

// Xóa câu hỏi
router.delete(
  "/:id",
  middlewareController.verifyAdmin,
  questionController.deleteQuestion
);

router.post(
  "/import",
  middlewareController.verifyAdmin,
  upload.single("file"),
  questionController.addQuestionsFromExcel
);

module.exports = router;
