// middlewareController.js
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

// Middleware xác thực token
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json("You are not authenticated");
  }

  try {
    const accessToken = token.split(" ")[1];
    jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid or has expired");
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(403).json("Invalid token format");
  }
};

// Middleware kiểm tra quyền admin
exports.verifyAdmin = (req, res, next) => {
  exports.verifyToken(req, res, () => {
    if (req.user.admin) {
      next();
    } else {
      res.status(403).json("You are not authorized to perform this action");
    }
  });
};

// Middleware kiểm tra quyền chỉnh sửa user
exports.verifyUserAuth = (req, res, next) => {
  exports.verifyToken(req, res, () => {
    if (req.user.id) {
      next();
    } else {
      res.status(403).json("You are not authorized to perform this action ccc");
    }
  });
};

// Rate limiting để prevent brute force
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again later",
});

// Middleware kiểm tra active session
exports.checkActiveQuiz = async (req, res, next) => {
  try {
    const studentQuiz = await StudentQuiz.findOne({
      userId: req.user.id,
      status: "InProgress",
    });

    if (studentQuiz) {
      req.activeQuiz = studentQuiz;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request logging
exports.requestLogger = (req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`
  );
  next();
};
// middlewareController.js
exports.verifyTokenAdminAuth = (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(401).json("You are not authenticated");
    }

    const accessToken = token.split(" ")[1];
    jwt.verify(accessToken, process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid");
      }
      if (!user.admin) {
        return res.status(403).json("You are not authorized");
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(403).json("Invalid token format");
  }
};

exports.checkQuizAccess = async (req, res, next) => {
  try {
    const quizId = req.params.quizId || req.params.id;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Admin có tất cả quyền truy cập
    if (req.user.admin) {
      req.quiz = quiz;
      return next();
    }

    // Kiểm tra sinh viên có trong lớp
    if (!quiz.classId.students.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this class" });
    }

    // Kiểm tra thời gian làm bài
    const now = new Date();
    if (now < new Date(quiz.startTime)) {
      return res.status(400).json({ message: "Quiz hasn't started yet" });
    }
    if (now > new Date(quiz.endTime)) {
      return res.status(400).json({ message: "Quiz has ended" });
    }

    req.quiz = quiz;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkClassAccess = async (req, res, next) => {
  try {
    const classId = req.params.classId || req.params.id;
    const userId = req.user.id;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Admin có tất cả quyền truy cập
    if (req.user.admin) {
      req.classData = classData;
      return next();
    }

    // Kiểm tra sinh viên có trong lớp
    if (!classData.students.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this class" });
    }

    req.classData = classData;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.validateQuizSubmission = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const { id: quizId } = req.params;
    const userId = req.user.id;

    // Kiểm tra có answers không
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid answers format" });
    }

    // Kiểm tra phiên làm bài
    const studentQuiz = await StudentQuiz.findOne({
      userId,
      quizId,
      status: "InProgress",
    });

    if (!studentQuiz) {
      return res.status(400).json({ message: "No active quiz session found" });
    }

    // Kiểm tra thời gian
    const quiz = await Quiz.findById(quizId);
    const now = new Date();
    const timeSpent = Math.floor((now - studentQuiz.startTime) / 1000 / 60);

    if (timeSpent > quiz.duration) {
      studentQuiz.status = "Terminated";
      await studentQuiz.save();
      return res.status(400).json({ message: "Time limit exceeded" });
    }

    // Validate từng câu trả lời
    for (const answer of answers) {
      if (!answer.questionId || !answer.selectedOption) {
        return res.status(400).json({
          message: "Each answer must have questionId and selectedOption",
        });
      }
    }

    req.studentQuiz = studentQuiz;
    req.quiz = quiz;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkActiveQuizzes = async (req, res, next) => {
  try {
    const classId = req.params.id;

    // Kiểm tra có quiz đang diễn ra không
    const activeQuizzes = await Quiz.find({
      classId,
      status: { $in: ["Published", "InProgress"] },
    });

    if (activeQuizzes.length > 0) {
      return res.status(400).json({
        message: "Cannot perform this action while there are active quizzes",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Monitoring middleware
exports.monitoringMiddleware = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const studentQuiz = await StudentQuiz.findOne({
      userId,
      quizId,
      status: "InProgress",
    });

    if (!studentQuiz) {
      return res.status(404).json({ message: "No active quiz session found" });
    }

    const quiz = await Quiz.findById(quizId);

    // Kiểm tra yêu cầu camera và fullscreen
    if (quiz.settings.requireCamera && !req.body.cameraEnabled) {
      studentQuiz.monitoringData.violations.push({
        type: "CameraOff",
        timestamp: new Date(),
        description: "Camera was turned off",
      });
    }

    if (quiz.settings.requireFullscreen && !req.body.isFullscreen) {
      studentQuiz.monitoringData.violations.push({
        type: "FullscreenExit",
        timestamp: new Date(),
        description: "Exited fullscreen mode",
      });
    }

    if (!quiz.settings.allowTabChange && req.body.tabSwitchOccurred) {
      studentQuiz.monitoringData.tabSwitchCount++;
      studentQuiz.monitoringData.violations.push({
        type: "TabSwitch",
        timestamp: new Date(),
        description: "Switched to another tab/window",
      });
    }

    await studentQuiz.save();
    req.studentQuiz = studentQuiz;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Giới hạn file upload
exports.uploadLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file && req.file.size > maxSize) {
    return res.status(400).json({ message: "File size exceeds 10MB limit" });
  }
  next();
};

// Validate file type
exports.validateExcelFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ message: "Only Excel files are allowed" });
  }

  next();
};
