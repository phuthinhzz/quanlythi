const StudentQuiz = require("../models/StudentQuiz.js");
const Quiz = require("../models/Quiz");
const Class = require("../models/Class");
const Result = require("../models/Result");
const { body, validationResult } = require("express-validator");
const User = require("../models/User.js");

// Validate dữ liệu
exports.validateStudentQuiz = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("quizId").notEmpty().withMessage("Quiz ID is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Bắt đầu làm bài kiểm tra
exports.createStudentQuiz = async (req, res) => {
  try {
    const classId = req.body.classId; // classId từ body hoặc params tùy vào yêu cầu
    console.log("classId", classId);

    const classData = await Class.findById(classId).populate("students quizzes");

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Lấy các userId và quizId từ dữ liệu lớp học
    const { students, quizzes } = classData;

    // Kiểm tra nếu lớp không có học sinh hoặc bài kiểm tra
    if (students.length === 0 || quizzes.length === 0) {
      return res.status(400).json({ message: "Class must have both students and quizzes" });
    }

    // Duyệt qua từng học viên
    const studentQuizPromises = students.map(async (student) => {
      // Tìm StudentQuiz hiện tại của học viên
      let studentQuiz = await StudentQuiz.findOne({ userId: student._id });

      // Nếu không tìm thấy StudentQuiz, tạo mới
      if (!studentQuiz) {
        // Nếu chưa có StudentQuiz, tạo mới và thêm tất cả quiz vào
        const quizzesData = quizzes.map((quiz) => ({
          quizId: quiz._id,
          status: "NotStarted",
          monitoringData: {
            cameraEnabled: false,
            isFullscreen: false,
            tabSwitchCount: 0,
          },
          violations: [],
        }));

        studentQuiz = new StudentQuiz({
          userId: student._id,
          quizzes: quizzesData,
        });

        await studentQuiz.save(); // Lưu StudentQuiz mới
      } else {
        // Nếu StudentQuiz đã tồn tại, kiểm tra các quiz chưa có và thêm chúng vào
        const existingQuizIds = studentQuiz.quizzes.map(q => q.quizId.toString());

        const newQuizzes = quizzes.filter((quiz) => !existingQuizIds.includes(quiz._id.toString()));

        if (newQuizzes.length > 0) {
          const quizzesData = newQuizzes.map((quiz) => ({
            quizId: quiz._id,
            status: "NotStarted",
            monitoringData: {
              cameraEnabled: false,
              isFullscreen: false,
              tabSwitchCount: 0,
            },
            violations: [],
          }));

          studentQuiz.quizzes.push(...quizzesData); // Thêm các quiz mới vào StudentQuiz

          await studentQuiz.save(); // Lưu lại StudentQuiz đã cập nhật
        }
      }

      return studentQuiz; // Trả về đối tượng StudentQuiz đã xử lý
    });

    // Chờ hoàn thành tất cả promises
    await Promise.all(studentQuizPromises);

    res.status(201).json({ message: "Student quizzes created or updated successfully" });
  } catch (error) {
    console.error("Error creating or updating student quizzes:", error);
    res.status(500).json({ message: "Error creating or updating student quizzes" });
  }
};

exports.startQuiz = async (req, res) => {
  try {
    const { quizId } = req.body;
    const userId = req.user.id;

    // Kiểm tra quiz tồn tại và đang active
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra thời gian
    const now = new Date();
    if (now < new Date(quiz.startTime)) {
      return res.status(400).json({ message: "Quiz hasn't started yet" });
    }
    if (now > new Date(quiz.endTime)) {
      return res.status(400).json({ message: "Quiz has ended" });
    }

    // Kiểm tra sinh viên có trong lớp không
    const classData = await Class.findById(quiz.classId);
    if (!classData.students.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this class" });
    }

    // Kiểm tra đã làm bài chưa
    let studentQuiz = await StudentQuiz.findOne({ userId, quizId });
    if (studentQuiz && studentQuiz.status !== "NotStarted") {
      return res
        .status(400)
        .json({ message: "You have already started this quiz" });
    }

    // Tạo hoặc cập nhật bản ghi StudentQuiz
    studentQuiz = await StudentQuiz.create({
      userId,
      quizId,
      startTime: now,
      status: "InProgress",
      monitoringData: {
        cameraEnabled: false,
        isFullscreen: false,
        tabSwitchCount: 0,
        violations: [],
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      message: "Quiz started successfully",
      studentQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái monitoring
exports.updateMonitoringStatus = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const { cameraEnabled, isFullscreen, violation } = req.body;

    const studentQuiz = await StudentQuiz.findOne({ userId, quizId });
    if (!studentQuiz) {
      return res.status(404).json({ message: "Quiz session not found" });
    }

    // Cập nhật trạng thái
    const update = {
      "monitoringData.cameraEnabled": cameraEnabled,
      "monitoringData.isFullscreen": isFullscreen,
    };

    // Ghi nhận vi phạm nếu có
    if (violation) {
      update["$push"] = {
        "monitoringData.violations": {
          type: violation.type,
          timestamp: new Date(),
          description: violation.description,
        },
      };

      if (violation.type === "TabSwitch") {
        update["monitoringData.tabSwitchCount"] =
          studentQuiz.monitoringData.tabSwitchCount + 1;
      }
    }

    const updatedStudentQuiz = await StudentQuiz.findOneAndUpdate(
      { userId, quizId },
      update,
      { new: true }
    );

    res.status(200).json(updatedStudentQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Nộp bài kiểm tra
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    // Kiểm tra phiên làm bài
    const studentQuiz = await StudentQuiz.findOne({ userId, quizId });
    if (!studentQuiz || studentQuiz.status !== "InProgress") {
      return res.status(400).json({ message: "Invalid quiz session" });
    }

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra thời gian
    const now = new Date();
    const timeSpent = Math.floor((now - studentQuiz.startTime) / 1000 / 60); // Thời gian làm bài (phút)

    if (timeSpent > quiz.duration) {
      studentQuiz.status = "Terminated";
      await studentQuiz.save();
      return res.status(400).json({ message: "Time limit exceeded" });
    }

    // Tính điểm
    let totalMarks = 0;
    let marksObtained = 0;
    const answersDetail = [];

    quiz.questions.forEach((question) => {
      totalMarks += question.points;
      const studentAnswer = answers.find(
        (a) => a.questionId === question._id.toString()
      );

      if (studentAnswer) {
        const isCorrect = question.options.some(
          (opt) => opt.text === studentAnswer.selectedOption && opt.isCorrect
        );

        if (isCorrect) {
          marksObtained += question.points;
        }

        answersDetail.push({
          questionId: question._id,
          selectedOption: studentAnswer.selectedOption,
          isCorrect,
          points: isCorrect ? question.points : 0,
          timeSpent: studentAnswer.timeSpent || 0,
        });
      }
    });

    // Tạo kết quả
    const result = await Result.create({
      userId,
      quizId,
      totalMarks,
      marksObtained,
      submissionDetails: {
        startTime: studentQuiz.startTime,
        endTime: now,
        timeSpent,
        submittedBy: "Student",
      },
      violationSummary: {
        cameraViolations: studentQuiz.monitoringData.violations.filter(
          (v) => v.type === "CameraOff"
        ).length,
        fullscreenViolations: studentQuiz.monitoringData.violations.filter(
          (v) => v.type === "FullscreenExit"
        ).length,
        tabSwitchViolations: studentQuiz.monitoringData.tabSwitchCount,
      },
      answers: answersDetail,
    });

    // Cập nhật trạng thái StudentQuiz
    studentQuiz.status = "Submitted";
    studentQuiz.endTime = now;
    await studentQuiz.save();

    res.status(200).json({
      message: "Quiz submitted successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách bài kiểm tra của sinh viên
exports.getStudentQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy danh sách lớp của sinh viên
    const classes = await Class.find({ students: userId });
    const classIds = classes.map((c) => c._id);

    // Lấy danh sách quiz từ các lớp
    const quizzes = await Quiz.find({
      classId: { $in: classIds },
    })
      .populate("classId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 });

    // Lấy thông tin làm bài của sinh viên
    const quizzesWithStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        const studentQuiz = await StudentQuiz.findOne({
          userId,
          quizId: quiz._id,
        });
        const result = await Result.findOne({ userId, quizId: quiz._id });

        return {
          ...quiz.toObject(),
          studentStatus: studentQuiz ? studentQuiz.status : "NotStarted",
          result: result
            ? {
              score: result.marksObtained,
              totalMarks: result.totalMarks,
              status: result.status,
            }
            : null,
        };
      })
    );

    res.status(200).json({
      quizzes: quizzesWithStatus,
      currentPage: page,
      totalPages: Math.ceil(quizzes.length / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết kết quả bài kiểm tra
exports.getQuizResult = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const result = await Result.findOne({ userId, quizId })
      .populate("quizId", "title duration")
      .populate("userId", "name mssv");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    const studentQuiz = await StudentQuiz.findOne({ userId, quizId });

    const resultDetail = {
      ...result.toObject(),
      violations: studentQuiz ? studentQuiz.monitoringData.violations : [],
      submissionTime: studentQuiz ? studentQuiz.endTime : null,
    };

    res.status(200).json(resultDetail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra trạng thái camera và fullscreen
exports.checkQuizStatus = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const studentQuiz = await StudentQuiz.findOne({ userId, quizId });
    if (!studentQuiz) {
      return res.status(404).json({ message: "Quiz session not found" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const requirements = {
      requireCamera: quiz.settings.requireCamera,
      requireFullscreen: quiz.settings.requireFullscreen,
      currentStatus: {
        cameraEnabled: studentQuiz.monitoringData.cameraEnabled,
        isFullscreen: studentQuiz.monitoringData.isFullscreen,
        violations: studentQuiz.monitoringData.violations,
      },
    };

    res.status(200).json(requirements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Lưu câu trả lời
exports.saveAnswer = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const { questionId, selectedOption, timeSpent } = req.body;

    const studentQuiz = await StudentQuiz.findOne({
      userId,
      quizId,
      status: "InProgress",
    });

    if (!studentQuiz) {
      return res.status(400).json({ message: "No active quiz session" });
    }

    const answer = await Answer.create({
      userId,
      quizId,
      questionId,
      selectedOption,
      timeSpent,
      submittedAt: new Date(),
    });

    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả studentQuiz records
exports.getAllStudentQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      StudentQuiz.find()
        .populate("userId", "name mssv")
        .populate("quizId", "title")
        .skip(skip)
        .limit(limit),
      StudentQuiz.countDocuments(),
    ]);

    res.status(200).json({
      records,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết studentQuiz
exports.getStudentQuizById = async (req, res) => {
  try {
    const record = await StudentQuiz.find({ userId: req.user.id })
      .populate("userId", "name mssv")
      .populate("quizId", "title duration");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Check permission
    if (!req.user.admin && req.user.id !== record.userId.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllStudentQuiz = async (req, res) => {
  try {
    // Truy xuất tất cả dữ liệu từ bảng StudentQuiz
    const data = await StudentQuiz.find();

    // Kiểm tra nếu không có dữ liệu
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No student quizzes found" });
    }

    // Trả về dữ liệu với status 200
    res.status(200).json(data);
  } catch (error) {
    // Xử lý lỗi
    res.status(500).json({ message: error.message });
  }
};



// Cập nhật studentQuiz
exports.updateStudentQuiz = async (req, res) => {
  try {
    const record = await StudentQuiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa studentQuiz
exports.deleteStudentQuiz = async (req, res) => {
  try {
    const record = await StudentQuiz.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// studentController.js
exports.startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quiz tồn tại và đang active
    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra thời gian
    const now = new Date();
    if (now < new Date(quiz.startTime)) {
      return res.status(400).json({ message: "Quiz hasn't started yet" });
    }
    if (now > new Date(quiz.endTime)) {
      return res.status(400).json({ message: "Quiz has ended" });
    }

    // Kiểm tra sinh viên có trong lớp
    if (!quiz.classId.students.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this class" });
    }

    // Kiểm tra đã có phiên làm bài chưa
    const existingSession = await StudentQuiz.findOne({
      userId,
      quizId,
      status: { $in: ["InProgress", "Submitted"] },
    });

    if (existingSession) {
      return res
        .status(400)
        .json({ message: "You have already taken this quiz" });
    }

    // Tạo phiên làm bài mới
    const studentQuiz = await StudentQuiz.create({
      userId,
      quizId,
      startTime: now,
      status: "InProgress",
      monitoringData: {
        cameraEnabled: false,
        isFullscreen: false,
        tabSwitchCount: 0,
        violations: [],
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Lấy câu hỏi và shuffle nếu cần
    let questions = await Question.find({
      _id: { $in: quiz.questions },
    }).select("text options points timeLimit");

    if (quiz.settings.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    // Ẩn đáp án đúng
    questions = questions.map((q) => ({
      ...q.toObject(),
      options: q.options.map((opt) => ({
        text: opt.text,
        isCorrect: undefined,
      })),
    }));

    res.status(200).json({
      sessionId: studentQuiz._id,
      quiz: {
        title: quiz.title,
        duration: quiz.duration,
        settings: quiz.settings,
        questions,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    // Kiểm tra phiên làm bài
    const studentQuiz = await StudentQuiz.findOne({
      userId,
      quizId,
      status: "InProgress",
    });

    if (!studentQuiz) {
      return res.status(400).json({ message: "No active quiz session found" });
    }

    const quiz = await Quiz.findById(quizId).populate("questions");

    // Kiểm tra thời gian làm bài
    const now = new Date();
    const timeSpent = Math.floor((now - studentQuiz.startTime) / 1000 / 60); // phút
    if (timeSpent > quiz.duration) {
      return res.status(400).json({ message: "Time limit exceeded" });
    }

    // Tính điểm
    let totalPoints = 0;
    let earnedPoints = 0;
    const answerDetails = [];

    quiz.questions.forEach((question) => {
      totalPoints += question.points;
      const studentAnswer = answers.find(
        (a) => a.questionId === question._id.toString()
      );

      if (studentAnswer) {
        const isCorrect = question.options.some(
          (opt) => opt.text === studentAnswer.selectedOption && opt.isCorrect
        );

        if (isCorrect) {
          earnedPoints += question.points;
        }

        answerDetails.push({
          questionId: question._id,
          selectedOption: studentAnswer.selectedOption,
          isCorrect,
          points: isCorrect ? question.points : 0,
          timeSpent: studentAnswer.timeSpent || 0,
        });
      }
    });

    // Tạo kết quả
    const result = await Result.create({
      userId,
      quizId,
      totalMarks: totalPoints,
      marksObtained: earnedPoints,
      submissionDetails: {
        startTime: studentQuiz.startTime,
        endTime: now,
        timeSpent,
        submittedBy: "Student",
      },
      violationSummary: {
        cameraViolations: studentQuiz.monitoringData.violations.filter(
          (v) => v.type === "CameraOff"
        ).length,
        fullscreenViolations: studentQuiz.monitoringData.violations.filter(
          (v) => v.type === "FullscreenExit"
        ).length,
        tabSwitchViolations: studentQuiz.monitoringData.tabSwitchCount,
      },
      answers: answerDetails,
    });

    // Cập nhật trạng thái làm bài
    studentQuiz.status = "Submitted";
    studentQuiz.endTime = now;
    await studentQuiz.save();

    res.status(200).json({
      message: "Quiz submitted successfully",
      result: {
        totalMarks: totalPoints,
        marksObtained: earnedPoints,
        percentage: (earnedPoints / totalPoints) * 100,
        status: result.status,
        violations: result.violationSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.quizbyUser = async (req, res) => {
  const { filter } = req.query;
  const userId = req.user.id; // Lấy userId từ thông tin người dùng trong JWT (hoặc req.user từ middleware)

  // Tạo một hàm xử lý trạng thái quiz
  const getQuizStatus = async (quiz, studentQuiz) => {
    const now = new Date();
    const start = new Date(quiz.startTime);
    const end = new Date(quiz.endTime);
    const classObj = await Class.findById(quiz.classId);
    const className = classObj ? classObj.name : "Unknown Class";
    let color;
    let text;
    let action;
    let status;

    if (studentQuiz && studentQuiz.status === "Submitted" || studentQuiz.status === "InProgress") {
      color = "bg-gray-100 text-gray-800";
      text = "Completed";
      action = null; // Không có hành động khi đã nộp bài
      status = "Completed"; // Trạng thái là "Completed"
    } else if (now < start) {
      color = "bg-yellow-100 text-yellow-800";
      text = "Upcoming";
      action = null; // Không có hành động khi quiz chưa bắt đầu
      status = "Upcoming";
    } else if (now > end) {
      color = "bg-red-100 text-red-800";
      text = "Missed";
      action = null; // Không có hành động khi thời gian làm bài đã kết thúc
      status = "Missed";
    } else {
      if (studentQuiz) {
        color = "bg-green-100 text-green-800";
        text = "Available";
        action = "Start Quiz";
        status = studentQuiz.status; // Trạng thái từ studentQuiz
      } else {
        color = "bg-green-100 text-green-800";
        text = "Available";
        action = "Start Quiz";
        status = "Not Started"; // Nếu chưa bắt đầu
      }
    }

    return { color, text, action, status, className };
  };

  try {
    let quizzes = [];
    const studentQuizzes = await StudentQuiz.findOne({ userId }); // Lấy tất cả student quizzes của học sinh

    // Lọc quiz theo trạng thái (upcoming, active, completed)
    if (filter === "upcoming") {
      quizzes = await Quiz.find({
        startTime: { $gt: new Date() }, // Lọc quiz sắp tới (chưa bắt đầu)
      });
    } else if (filter === "active") {
      quizzes = await Quiz.find({
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }, // Lọc quiz đang diễn ra
      });
    } else if (filter === "completed") {
      quizzes = await Quiz.find({
        endTime: { $lt: new Date() }, // Lọc quiz đã hoàn thành
      });
    }

    // Cập nhật trạng thái quiz cho mỗi quiz
    const quizzesWithStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        console.log("quiz", quiz);

        // Kiểm tra và đảm bảo rằng quiz._id và studentQuiz.quizId tồn tại trước khi gọi toString
        const studentQuiz = studentQuizzes?.quizzes?.find(
          (sq) => sq.quizId?.toString() === quiz._id?.toString()
        );

        console.log("studentQuiz", studentQuiz);

        // Bỏ qua trạng thái từ cơ sở dữ liệu, chỉ sử dụng trạng thái tính toán
        const status = await getQuizStatus(quiz, studentQuiz);

        return {
          ...quiz.toObject(),
          studentStatus: studentQuiz?.status || "Not Started",
          status, // Chỉ sử dụng trạng thái từ hàm getQuizStatus
        };
      })
    );


    // Trả về danh sách quiz theo filter
    res.status(200).json({ quizzes: quizzesWithStatus });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
};

exports.getReuiltByUserId = async (req, res) => {
  try {
    // const userId = req.params.id;
    const result = await Result.find();

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


