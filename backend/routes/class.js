const express = require("express");
const classController = require("../controllers/classController");
const middlewareController = require("../controllers/middlewareController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Thư mục lưu file tạm thời

const router = express.Router();

// Tạo lớp thi mới
router.post("/", middlewareController.verifyAdmin, classController.createClass);

// Lấy danh sách tất cả các lớp thi
router.get(
  "/",
  middlewareController.verifyAdmin,
  classController.getAllClasses
);
router.get(
  "/:id",
  middlewareController.verifyAdmin,
  classController.getClassesById
);

// Sửa thông tin lớp thi
router.put(
  "/:id",
  middlewareController.verifyAdmin,
  classController.updateClass
);

// Xóa lớp thi
router.delete(
  "/:id",
  middlewareController.verifyAdmin,
  classController.deleteClass
);

// Import lớp từ file Excel
router.post(
  "/import",
  middlewareController.verifyAdmin,
  classController.importClassesFromExcel
);

// Hiển thị danh sách sinh viên trong lớp
router.get(
  "/:id/students",
  middlewareController.verifyAdmin,
  classController.getStudentsInClass
);

// Hiển thị danh sách lớp của sinh viên
router.get(
  "/student",
  middlewareController.verifyToken,
  classController.getClassesForStudent
);

// Thêm sinh viên vào lớp từ file Excel
router.post(
  "/import-students/:id",
  middlewareController.verifyAdmin,
  upload.single("file"),
  classController.addStudentsToClassFromExcel
);
router.get(
  "/studentlist/:id",
  middlewareController.verifyAdmin,
  classController.getStudentByClassId
);
router.get(
  "/class-user",
  middlewareController.verifyUserAuth,
  classController.getClassByUserId
);
router.post(
  "/remove-student",
  middlewareController.verifyAdmin,
  classController.removeStudentFromClass
);
module.exports = router;
