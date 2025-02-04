const express = require("express");
const classController = require("../controllers/classController");
const middlewareController = require("../controllers/middlewareController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Thư mục lưu file tạm thời

const router = express.Router();
router.get(
  "/class-user",
  middlewareController.verifyUserAuth,
  classController.getClassByUserId
);
module.exports = router;
