const express = require("express");
const resultController = require("../controllers/resultController");
const middlewareController = require("../controllers/middlewareController");
const router = express.Router();

// Lấy kết quả của một sinh viên
router.get(
  "/user",
  middlewareController.verifyToken,
  resultController.getResultsByUser
);

// Lấy bảng điểm của một lớp thi
router.get(
  "/class/:quizId",
  middlewareController.verifyAdmin,
  resultController.getResultsByClass
);
router.post(
  "/:id/submit",
  middlewareController.verifyUserAuth,
  resultController.createResult
);

module.exports = router;
