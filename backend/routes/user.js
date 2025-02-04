const multer = require("multer");
const middlewareController = require("../controllers/middlewareController");
const userController = require("../controllers/userController");

const router = require("express").Router();

// GET ALL USERS
router.get("/", middlewareController.verifyToken, userController.getAllUser);
router.get(
  "/:id",
  middlewareController.verifyToken,
  userController.getUserById
);

// DELETE USER BY ID
router.delete(
  "/:id",
  middlewareController.verifyAdmin,
  userController.deleteUser
);

// EDIT USER BY ID
router.put("/:id", middlewareController.verifyToken, userController.editUser);

// Cấu hình Multer để upload file
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

// Route upload file Excel để tạo người dùng hàng loạt
router.post(
  "/import",
  middlewareController.verifyAdmin,
  upload.single("file"), // Nhận file upload với key "file"
  userController.importUsers
);
router.post("/", middlewareController.verifyAdmin, userController.createUser);
router.get("/all-user/all", middlewareController.verifyAdmin, userController.getAllUserNotQuery);

module.exports = router;
