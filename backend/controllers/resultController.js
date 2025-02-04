const mongoose = require("mongoose");

const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const Class = require("../models/Class");
const Answer = require("../models/Answer");
const StudentQuiz = require("../models/StudentQuiz.js");
const { body, validationResult } = require("express-validator");
const Question = require("../models/Question.js");

// Middleware xác thực dữ liệu
exports.validateResult = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("quizId").notEmpty().withMessage("Quiz ID is required"),
  body("totalMarks").isNumeric().withMessage("Total marks must be a number"),
  body("marksObtained")
    .isNumeric()
    .withMessage("Marks obtained must be a number"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Lấy kết quả theo ID
exports.getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate("userId", "name mssv email")
      .populate({
        path: "quizId",
        select: "title duration startTime endTime",
        populate: { path: "classId", select: "name" },
      });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Kiểm tra quyền truy cập
    if (!req.user.admin && req.user.id !== result.userId.toString()) {
      return res.status(403).json({
        message: "You don't have permission to view this result",
      });
    }

    // Lấy thông tin chi tiết về câu trả lời
    const answers = await Answer.find({
      userId: result.userId,
      quizId: result.quizId,
    }).populate("questionId", "text points");

    // Lấy thông tin về giám sát
    const studentQuiz = await StudentQuiz.findOne({
      userId: result.userId,
      quizId: result.quizId,
    });

    // Tổng hợp thông tin chi tiết
    const detailedResult = {
      ...result.toObject(),
      answers,
      monitoringDetails: studentQuiz
        ? {
            violations: studentQuiz.monitoringData.violations,
            tabSwitches: studentQuiz.monitoringData.tabSwitchCount,
            timeSpentOutOfFullscreen:
              studentQuiz.monitoringData.violations.filter(
                (v) => v.type === "FullscreenExit"
              ).length,
          }
        : null,
    };

    res.status(200).json(detailedResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách kết quả của một bài kiểm tra
exports.getResultsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy thông tin quiz
    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra quyền truy cập
    if (!req.user.admin && !quiz.classId.students.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Query với filter
    let filter = { quizId };
    if (!req.user.admin) {
      filter.userId = req.user.id;
    }

    // Thêm filter theo status nếu có
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate("userId", "name mssv")
        .skip(skip)
        .limit(limit)
        .sort({ marksObtained: -1 }),
      Result.countDocuments(filter),
    ]);

    // Tính toán thống kê
    const stats = await Result.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$marksObtained" },
          highestScore: { $max: "$marksObtained" },
          lowestScore: { $min: "$marksObtained" },
          passCount: {
            $sum: { $cond: [{ $eq: ["$status", "Passed"] }, 1, 0] },
          },
          totalStudents: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      results,
      stats: stats[0] || {},
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy kết quả của sinh viên trong một lớp học
exports.getStudentResults = async (req, res) => {
  try {
    const { classId, userId } = req.params;

    // Kiểm tra quyền truy cập
    if (!req.user.admin && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Lấy danh sách quiz của lớp
    const quizzes = await Quiz.find({ classId });
    const quizIds = quizzes.map((quiz) => quiz._id);

    // Lấy kết quả của tất cả bài quiz
    const results = await Result.find({
      userId,
      quizId: { $in: quizIds },
    }).populate("quizId", "title startTime endTime duration");

    // Tính toán thống kê
    const stats = {
      totalQuizzes: quizzes.length,
      completedQuizzes: results.length,
      averageScore: 0,
      passedQuizzes: 0,
    };

    if (results.length > 0) {
      const totalScore = results.reduce((sum, r) => sum + r.marksObtained, 0);
      stats.averageScore = totalScore / results.length;
      stats.passedQuizzes = results.filter((r) => r.status === "Passed").length;
    }

    res.status(200).json({
      results,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin kết quả (chỉ admin)
exports.updateResult = async (req, res) => {
  try {
    // Chỉ admin mới có quyền cập nhật
    if (!req.user.admin) {
      return res.status(403).json({ message: "Only admin can update results" });
    }

    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Cập nhật feedback nếu có
    if (req.body.feedback) {
      result.feedback = {
        ...result.feedback,
        comment: req.body.feedback.comment,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      };
    }

    // Lưu các thay đổi
    const updatedResult = await result.save();
    res.status(200).json(updatedResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tạo báo cáo tổng hợp cho lớp học
exports.generateClassReport = async (req, res) => {
  try {
    const { classId } = req.params;

    // Kiểm tra quyền admin
    if (!req.user.admin) {
      return res
        .status(403)
        .json({ message: "Only admin can generate reports" });
    }

    // Lấy thông tin lớp và quiz
    const classData = await Class.findById(classId).populate("students");
    const quizzes = await Quiz.find({ classId });

    // Tạo báo cáo cho từng quiz
    const quizReports = await Promise.all(
      quizzes.map(async (quiz) => {
        const results = await Result.find({ quizId: quiz._id });

        return {
          quizId: quiz._id,
          title: quiz.title,
          totalStudents: results.length,
          averageScore:
            results.reduce((sum, r) => sum + r.marksObtained, 0) /
              results.length || 0,
          passRate:
            (results.filter((r) => r.status === "Passed").length /
              results.length) *
              100 || 0,
          participationRate: (results.length / classData.students.length) * 100,
        };
      })
    );

    // Tính toán thống kê tổng thể
    const overallStats = {
      totalStudents: classData.students.length,
      totalQuizzes: quizzes.length,
      averageParticipation:
        quizReports.reduce((sum, r) => sum + r.participationRate, 0) /
        quizzes.length,
      averagePassRate:
        quizReports.reduce((sum, r) => sum + r.passRate, 0) / quizzes.length,
    };

    const report = {
      class: {
        id: classId,
        name: classData.name,
        startTime: classData.startTime,
        endTime: classData.endTime,
      },
      overallStats,
      quizReports,
      generatedAt: new Date(),
      generatedBy: req.user.id,
    };

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xuất kết quả theo format (PDF/Excel)
exports.exportResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { format } = req.query;

    // Kiểm tra quyền admin
    if (!req.user.admin) {
      return res.status(403).json({ message: "Only admin can export results" });
    }

    const results = await Result.find({ quizId })
      .populate("userId", "name mssv")
      .populate("quizId", "title");

    if (format === "excel") {
      // Tạo file Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        results.map((r) => ({
          StudentID: r.userId.mssv,
          Name: r.userId.name,
          Score: r.marksObtained,
          TotalMarks: r.totalMarks,
          Status: r.status,
          SubmittedAt: r.submissionDetails.endTime,
        }))
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

      // Gửi file về client
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=results-${quizId}.xlsx`
      );
      res.send(buffer);
    } else {
      res.status(400).json({ message: "Unsupported export format" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Lấy tất cả kết quả
exports.getAllResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Result.find()
        .populate("userId", "name mssv")
        .populate("quizId", "title")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Result.countDocuments(),
    ]);

    res.status(200).json({
      results,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy kết quả của sinh viên theo bài kiểm tra
exports.getResultsByStudentAndQuiz = async (req, res) => {
  try {
    const { quizId, userId } = req.params;

    if (!req.user.admin && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await Result.findOne({ quizId, userId })
      .populate("quizId", "title duration")
      .populate("answers.questionId", "text points");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xếp hạng sinh viên trong bài kiểm tra
exports.getLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;

    const results = await Result.find({ quizId })
      .populate("userId", "name mssv")
      .sort({ marksObtained: -1 })
      .select("marksObtained totalMarks submissionDetails");

    // Thêm rank cho mỗi kết quả
    const leaderboard = results.map((result, index) => ({
      rank: index + 1,
      ...result.toObject(),
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy kết quả của lớp
exports.getClassResults = async (req, res) => {
  try {
    const { classId } = req.params;
    const quizzes = await Quiz.find({ classId });
    const quizIds = quizzes.map((quiz) => quiz._id);

    const results = await Result.find({
      quizId: { $in: quizIds },
    })
      .populate("userId", "name mssv")
      .populate("quizId", "title");

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getResultsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Result.find({ userId })
        .populate("quizId", "title duration classId")
        .populate({
          path: "quizId",
          populate: { path: "classId", select: "name" },
        })
        .skip(skip)
        .limit(limit)
        .sort({ submissionDetails: { endTime: -1 } }),
      Result.countDocuments({ userId }),
    ]);

    // Tính toán thống kê
    const stats = {
      totalQuizzes: total,
      averageScore: 0,
      passedQuizzes: 0,
    };

    if (results.length > 0) {
      stats.averageScore =
        results.reduce(
          (sum, r) => sum + (r.marksObtained / r.totalMarks) * 100,
          0
        ) / results.length;
      stats.passedQuizzes = results.filter((r) => r.status === "Passed").length;
    }

    res.status(200).json({
      results,
      stats,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResultsByClass = async (req, res) => {
  try {
    const { quizId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Lấy kết quả và thông tin sinh viên
    const [results, total] = await Promise.all([
      Result.find({ quizId })
        .populate("userId", "name mssv email")
        .skip(skip)
        .limit(limit)
        .sort({ marksObtained: -1 }),
      Result.countDocuments({ quizId }),
    ]);

    // Tính toán thống kê
    const stats = {
      totalStudents: quiz.classId.students.length,
      submittedCount: total,
      averageScore: 0,
      passRate: 0,
      highestScore: 0,
      lowestScore: results.length > 0 ? results[0].totalMarks : 0,
    };

    if (results.length > 0) {
      stats.averageScore =
        results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length;
      stats.passRate =
        (results.filter((r) => r.status === "Passed").length / total) * 100;
      stats.highestScore = Math.max(...results.map((r) => r.marksObtained));
      stats.lowestScore = Math.min(...results.map((r) => r.marksObtained));
    }

    // Thêm chi tiết về vi phạm nếu có
    const resultsWithViolations = await Promise.all(
      results.map(async (result) => {
        const studentQuiz = await StudentQuiz.findOne({
          userId: result.userId._id,
          quizId,
        });

        return {
          ...result.toObject(),
          violations: studentQuiz ? studentQuiz.monitoringData.violations : [],
        };
      })
    );

    res.status(200).json({
      results: resultsWithViolations,
      stats,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createResult = async (req, res) => {
  const { answers, fullscreenCount, tabSwitchCount } = req.body;
  console.log("answers", answers);
  const id = req.params.id; // quizId từ URL
  const userId = req.user.id; // Giả sử bạn có thông tin userId từ auth

  try {
    // Kiểm tra quiz có tồn tại không
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(400).json({ message: "Quiz not found" });
    }

    // Kiểm tra quiz.questions là một mảng hợp lệ
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res
        .status(400)
        .json({
          message: "Invalid quiz structure: questions not found or empty",
        });
    }

    // Tính tổng điểm của người dùng dựa trên câu trả lời đã chọn
    let totalPoints = 0;
    for (const questionId in answers) {
      const userAnswer = answers[questionId];

      // Kiểm tra nếu questionId là một ObjectId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(questionId)) {
        console.warn(`Invalid question ID: ${questionId}`);
        continue; // Bỏ qua câu hỏi không hợp lệ
      }

      // Tìm câu hỏi trong quiz.questions (các ObjectId)
      const questionObjId = new mongoose.Types.ObjectId(questionId);
      const question = await Question.findById(questionObjId);

      // Nếu không tìm thấy câu hỏi, bỏ qua câu hỏi này
      if (!question) {
        console.warn(`Question with ID ${questionId} not found`);
        continue;
      }

      // Kiểm tra câu trả lời người dùng có đúng không
      const correctOption = question.options.find((option) => option.isCorrect);
      if (correctOption && correctOption.text === userAnswer.selectedOption) {
        totalPoints += question.points; // Cộng điểm cho câu trả lời đúng
      }
    }

    // Tính tổng điểm của tất cả các câu hỏi
    const totalMarks = quiz.questions.reduce((sum, question) => {
      return sum + (question.points || 0); // Đảm bảo rằng điểm câu hỏi là số hợp lệ
    }, 0);

    // Nếu tổng điểm là NaN hoặc không hợp lệ
    if (isNaN(totalMarks)) {
      return res
        .status(500)
        .json({
          message:
            "Failed to calculate total marks, invalid points in questions.",
        });
    }

    // Cập nhật thông tin tổng điểm và trạng thái
    const status = totalPoints >= quiz.passingScore ? "Passed" : "Failed"; // Giả sử có một điểm chuẩn passingScore trong quiz
    let marksObtained = totalPoints;
    const violationSummary = {
      cameraViolations: 0,
      fullscreenViolations: fullscreenCount,
      tabSwitchViolations: tabSwitchCount,
      totalViolations: fullscreenCount + tabSwitchCount,
    };
    if (fullscreenCount > 0 && tabSwitchCount > 0) {
      marksObtained = 0;
    }
    // Tạo kết quả mới
    const result = new Result({
      quizId: id,
      userId,
      answers,
      totalPoints,
      status,
      violationSummary, // Thêm status
      marksObtained, // Thêm marksObtained
      totalMarks, // Thêm totalMarks
      submittedAt: new Date(),
    });

    // Lưu kết quả vào cơ sở dữ liệu
    await result.save();

    // Cập nhật trạng thái của quiz trong studentQuiz thành "Completed"
    const studentQuiz = await StudentQuiz.findOne({ userId });
    if (studentQuiz) {
      // Cập nhật quiz tương ứng trong mảng quizzes của studentQuiz
      const quizIndex = studentQuiz.quizzes.findIndex(
        (q) => q.quizId.toString() === id
      );
      if (quizIndex !== -1) {
        studentQuiz.quizzes[quizIndex].status = "Submitted"; // Cập nhật status của quiz
        await studentQuiz.save(); // Lưu thay đổi vào cơ sở dữ liệu
      } else {
        console.warn("Quiz not found in studentQuiz.");
      }
    } else {
      console.warn("StudentQuiz not found for this user.");
    }

    // Trả về phản hồi thành công
    res.status(200).json({ message: "Quiz submitted successfully", result });
  } catch (error) {
    console.error("Error creating result:", error);
    res
      .status(500)
      .json({ message: "Failed to create result", error: error.message });
  }
};
