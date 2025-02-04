const express = require("express");
const studentController = require("../controllers/studentController");
const middlewareController = require("../controllers/middlewareController");
const router = express.Router();

router.get(
    "/quizzes",
    middlewareController.verifyUserAuth,
    studentController.quizbyUser
);
router.get(
    "/resuilt",
    middlewareController.verifyAdmin,
    studentController.getReuiltByUserId
);
router.get(
    "/:id",
    middlewareController.verifyUserAuth,
    studentController.getUserById
);
// router.post(
//     "/update-status-quiz",
//     middlewareController.verifyUserAuth,
//     studentController.updateStatusStudentQuiz
// );

module.exports = router;
