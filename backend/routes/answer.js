const express = require("express");
const answerController = require("../controllers/answerController");
const middlewareController = require("../controllers/middlewareController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Thư mục lưu file tạm thời
const router = express.Router();
router.post(
    "/students/:id",
    middlewareController.verifyUserAuth,
    answerController.saveAnswer
  );

module.exports = router;