const Quiz = require("../models/Quiz");
const Class = require("../models/Class");
const Question = require("../models/Question");
const StudentQuiz = require("../models/StudentQuiz.js");
const cron = require("node-cron");
const { body, validationResult } = require("express-validator");

// Validate dữ liệu quiz
exports.validateQuiz = [
  body("title").notEmpty().withMessage("Title is required"),
  body("classId").notEmpty().withMessage("Class ID is required"),
  body("duration")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 minute"),
  body("startTime").notEmpty().withMessage("Start time is required"),
  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),
  body("settings")
    .optional()
    .isObject()
    .withMessage("Settings must be an object"),
  body("settings.requireCamera")
    .optional()
    .isBoolean()
    .withMessage("requireCamera must be boolean"),
  body("settings.requireFullscreen")
    .optional()
    .isBoolean()
    .withMessage("requireFullscreen must be boolean"),
  body("settings.allowTabChange")
    .optional()
    .isBoolean()
    .withMessage("allowTabChange must be boolean"),
  body("settings.shuffleQuestions")
    .optional()
    .isBoolean()
    .withMessage("shuffleQuestions must be boolean"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Tự động cập nhật trạng thái bài kiểm tra
cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();

    // Cập nhật quiz đến giờ bắt đầu -> Published
    await Quiz.updateMany(
      {
        status: "Draft",
        startTime: { $lte: now },
        endTime: { $gt: now },
      },
      { $set: { status: "Published" } }
    );

    // Cập nhật quiz đã kết thúc -> Completed
    await Quiz.updateMany(
      {
        status: { $in: ["Published", "InProgress"] },
        endTime: { $lte: now },
      },
      { $set: { status: "Completed" } }
    );

    console.log("Quiz statuses updated successfully");
  } catch (error) {
    console.error("Error updating quiz statuses:", error.message);
  }
});
// exports.getAllQuizzes = async (req, res) => {
//   try {
//     // Lấy các tham số từ query string
//     const { page = 1, status, classId, search } = req.query;
//     const pageSize = 10; // Số quiz mỗi trang

//     // Tạo các điều kiện lọc
//     let filter = {};
//     if (status) {
//       filter.status = status;
//     }
//     if (classId) {
//       filter.classId = mongoose.Types.ObjectId(classId); // Chuyển đổi classId thành ObjectId
//     }
//     if (search) {
//       filter.title = { $regex: search, $options: "i" }; // Tìm kiếm không phân biệt chữ hoa/thường
//     }

//     // Lấy số lượng quiz và danh sách quiz cho trang hiện tại
//     const quizzes = await Quiz.find(filter)
//       .skip((page - 1) * pageSize)  // Bỏ qua các quiz của các trang trước
//       .limit(pageSize)              // Giới hạn số quiz mỗi trang
//       .populate("classId", "name")  // Populate tên lớp nếu cần
//       .populate("createdBy", "username"); // Populate tên người tạo quiz nếu cần

//     // Lấy tổng số quiz để tính tổng trang
//     const totalQuizzes = await Quiz.countDocuments(filter);
//     const totalPages = Math.ceil(totalQuizzes / pageSize);

//     // Trả về dữ liệu
//     res.json({
//       quizzes,
//       totalPages,
//     });
//   } catch (error) {
//     console.error("Error fetching quizzes:", error);
//     res.status(500).json({ message: "Error fetching quizzes" });
//   }
// }
// Tạo bài kiểm tra mới
exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      classId,
      questions,
      startTime,
      endTime,
      duration,
      settings,
    } = req.body;

    // Kiểm tra lớp học tồn tại
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Tạo quiz với settings mặc định nếu không được cung cấp
    const defaultSettings = {
      requireCamera: true,
      requireFullscreen: true,
      allowTabChange: false,
      shuffleQuestions: false,
    };

    const newQuiz = await Quiz.create({
      title,
      classId,
      questions,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      status: "Draft",
      settings: { ...defaultSettings, ...settings },
      createdBy: req.user.id,
    });

    // Thêm quiz vào lớp học
    await Class.findByIdAndUpdate(classId, {
      $push: { quizzes: newQuiz._id },
    });

    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách bài kiểm tra với filter và phân trang
exports.getAllQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Xây dựng query filter
    let filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;

    // Thêm filter theo thời gian
    if (req.query.upcoming === "true") {
      filter.startTime = { $gt: new Date() };
    } else if (req.query.ongoing === "true") {
      const now = new Date();
      filter.startTime = { $lte: now };
      filter.endTime = { $gt: now };
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .populate("questions", "text points difficulty")
        .populate("createdBy", "name")
        .populate("classId", "name")
        .skip(skip)
        .limit(limit)
        .sort({ startTime: -1 }),
      Quiz.countDocuments(filter),
    ]);

    res.status(200).json({
      quizzes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalQuizzes: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllQuizzesNotQuery = async (req, res) => {
  try {
    // Lấy tất cả quizzes từ cơ sở dữ liệu
    const data = await Quiz.find();

    // Kiểm tra nếu có dữ liệu
    if (data.length > 0) {
      return res.status(200).json(data);  // Trả về tất cả quizzes nếu có
    } else {
      return res.status(404).json({
        message: "No quizzes found",  // Trả về thông báo nếu không có quizzes
      });
    }
  } catch (error) {
    // Log lỗi chi tiết và trả về lỗi cho người dùng
    console.error("Error fetching quizzes:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,  // Trả về thông báo lỗi chi tiết
    });
  }
};
exports.getAllQuizzesWithClassName = async (req, res) => {
  try {
    // Lấy tất cả quizzes từ cơ sở dữ liệu
    const data = await Quiz.find().populate('classId', 'name');

    // Kiểm tra nếu có dữ liệu
    if (data.length > 0) {
      return res.status(200).json(data);  // Trả về tất cả quizzes nếu có
    } else {
      return res.status(404).json({
        message: "No quizzes found",  // Trả về thông báo nếu không có quizzes
      });
    }
  } catch (error) {
    // Log lỗi chi tiết và trả về lỗi cho người dùng
    console.error("Error fetching quizzes:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,  // Trả về thông báo lỗi chi tiết
    });
  }
};


// Bắt đầu bài kiểm tra cho sinh viên
exports.startQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;  // Lấy quizId từ params
    const userId = req.user.id;    // Lấy userId từ thông tin người dùng đã xác thực

    // Tìm quiz theo quizId
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found with the provided ID" });
    }

    // Kiểm tra thời gian để xem quiz có thể bắt đầu được không
    const now = new Date();
    if (now < new Date(quiz.startTime)) {
      return res.status(400).json({ message: "Quiz hasn't started yet" });
    }
    if (now > new Date(quiz.endTime)) {
      return res.status(400).json({ message: "Quiz has ended" });
    }

    // Tìm bản ghi StudentQuiz của người dùng này
    let studentQuiz = await StudentQuiz.findOne({ userId });

    if (!studentQuiz) {
      return res.status(404).json({ message: "Student quiz record not found" });
    }

    // Kiểm tra xem quizId đã có trong mảng quizzes chưa
    const quizIndex = studentQuiz.quizzes.findIndex(q => q.quizId.toString() === quizId.toString());

    if (quizIndex === -1) {
      return res.status(400).json({ message: "Quiz not assigned to this student" });
    }

    // Kiểm tra xem quiz này đã bắt đầu chưa
    const quizStatus = studentQuiz.quizzes[quizIndex].status;
    console.log("quizStatus", quizStatus)
    // if (quizStatus !== "NotStarted") {
    //   return res.status(400).json({ message: "You have already started or completed this quiz" });
    // }
    if (quizStatus === "Submitted") {

      return res.status(400).json({ message: "You have exited the test page or completed this quiz!" });
    }

    // Cập nhật trạng thái của quiz trong mảng quizzes
    studentQuiz.quizzes[quizIndex].status = "InProgress";
    studentQuiz.quizzes[quizIndex].startTime = now;

    // Lưu bản ghi StudentQuiz đã được cập nhật
    await studentQuiz.save();

    // Lấy danh sách câu hỏi của quiz (có thể shuffle nếu được cấu hình)
    let questions = await Question.find({
      _id: { $in: quiz.questions },
    }).select("text options points timeLimit");

    if (quiz.settings.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5); // Shuffle questions
    }

    // Trả về dữ liệu quiz và trạng thái StudentQuiz đã được cập nhật
    res.status(200).json({
      quiz: {
        ...quiz.toObject(),
        questions,
      },
      studentQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Cập nhật trạng thái giám sát
exports.updateMonitoringStatus = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { cameraEnabled, isFullscreen, tabSwitchOccurred } = req.body;
    const userId = req.user.id;

    const studentQuiz = await StudentQuiz.findOne({ userId, quizId });
    if (!studentQuiz) {
      return res.status(404).json({ message: "Quiz session not found" });
    }

    // Cập nhật trạng thái monitoring
    const update = {
      "monitoringData.cameraEnabled": cameraEnabled,
      "monitoringData.isFullscreen": isFullscreen,
    };

    if (tabSwitchOccurred) {
      update["monitoringData.tabSwitchCount"] =
        studentQuiz.monitoringData.tabSwitchCount + 1;
      update["$push"] = {
        "monitoringData.violations": {
          type: "TabSwitch",
          timestamp: new Date(),
          description: "Tab switch detected",
        },
      };
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

// Lấy danh sách sinh viên đang làm bài
exports.getActiveStudents = async (req, res) => {
  try {
    const { quizId } = req.params;

    const activeStudents = await StudentQuiz.find({
      quizId,
      status: "InProgress",
    }).populate("userId", "name mssv");

    res.status(200).json(activeStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Các chức năng khác được giữ nguyên từ controller cũ
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("questions")
      .populate("createdBy", "name")
      .populate("classId", "name");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật quiz
exports.updateQuiz = async (req, res) => {
  try {
    // Không cho phép cập nhật quiz đang diễn ra
    const quiz = await Quiz.findById(req.params.id);
    if (quiz.status === "InProgress") {
      return res.status(400).json({
        message: "Cannot update quiz while it is in progress",
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json(updatedQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa quiz
exports.deleteQuiz = async (req, res) => {
  try {
    // Không cho phép xóa quiz đang diễn ra hoặc đã hoàn thành
    const quiz = await Quiz.findById(req.params.id);
    if (quiz.status !== "Draft") {
      return res.status(400).json({
        message: "Can only delete quizzes in Draft status",
      });
    }

    // Xóa quiz và cập nhật reference trong Class
    await Promise.all([
      Quiz.findByIdAndDelete(req.params.id),
      Class.updateMany(
        { quizzes: req.params.id },
        { $pull: { quizzes: req.params.id } }
      ),
    ]);

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Thêm câu hỏi vào quiz
exports.addQuestionsToQuiz = async (req, res) => {
  try {
    const { quizId, questionIds } = req.body;

    // Kiểm tra nếu không có quizId hoặc questionIds
    if (!quizId || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({
        message: "quizId and questionIds are required, and questionIds must be an array",
      });
    }

    // Kiểm tra quiz có tồn tại hay không
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra các câu hỏi có tồn tại hay không
    const validQuestions = await Question.find({ _id: { $in: questionIds } });
    if (validQuestions.length !== questionIds.length) {
      return res.status(400).json({
        message: "Some questions are invalid or do not exist",
      });
    }

    // Loại bỏ các câu hỏi đã tồn tại trong quiz.questions
    const newQuestions = questionIds.filter(
      (questionId) => !quiz.questions.includes(questionId)
    );

    if (newQuestions.length === 0) {
      return res.status(400).json({
        message: "All the provided questions already exist in the quiz",
      });
    }

    // Thêm các câu hỏi mới vào quiz
    quiz.questions = [...quiz.questions, ...newQuestions];

    // Lưu lại quiz
    await quiz.save();

    res.status(200).json({
      message: "Questions added to quiz successfully",
      addedQuestions: newQuestions, // Trả về danh sách các câu hỏi được thêm
      quiz,
    });
  } catch (error) {
    console.error("Error adding questions to quiz:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


// Xóa câu hỏi khỏi quiz
exports.removeQuestionsFromQuiz = async (req, res) => {
  try {
    const { quizId, questionIds } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra quiz chưa bắt đầu
    if (quiz.status !== "Draft") {
      return res.status(400).json({
        message: "Can only remove questions from draft quizzes",
      });
    }

    // Xóa các câu hỏi khỏi quiz
    quiz.questions = quiz.questions.filter(
      (id) => !questionIds.includes(id.toString())
    );
    await quiz.save();

    res.status(200).json({
      message: "Questions removed successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách câu hỏi của quiz
exports.getQuizQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate("questions", "text options points difficulty timeLimit")
      .select("questions");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json(quiz.questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái quiz
exports.updateQuizStatus = async (req, res) => {
  try {
    const { quizId } = req.body;

    // Tìm quiz theo quizId
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Kiểm tra logic chuyển trạng thái
    const now = new Date();
    let status = quiz.status; // Đặt trạng thái mặc định là trạng thái hiện tại của quiz

    if (now < quiz.startTime) {
      // Trạng thái là "Published" nếu chưa đến giờ bắt đầu
      status = "Published";
    } else if (now >= quiz.startTime && now <= quiz.endTime) {
      // Trạng thái là "InProgress" nếu trong khoảng thời gian bắt đầu và kết thúc
      status = "InProgress";
    } else {
      // Trạng thái là "Completed" nếu đã qua thời gian kết thúc
      status = "Completed";
    }

    // Cập nhật trạng thái quiz
    quiz.status = status;
    await quiz.save();

    // Trả về kết quả
    res.status(200).json({
      message: "Quiz status updated successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQuizzesByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Kiểm tra quyền truy cập
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (!req.user.admin && !classData.students.includes(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Lấy danh sách quiz với filter theo trạng thái
    let filter = { classId };
    if (!req.user.admin) {
      // Sinh viên chỉ thấy các quiz đã publish hoặc đang diễn ra
      filter.status = { $in: ["Published", "InProgress"] };
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .populate("questions", "text points difficulty")
        .populate("createdBy", "name")
        .skip(skip)
        .limit(limit)
        .sort({ startTime: -1 }),
      Quiz.countDocuments(filter),
    ]);

    // Thêm thông tin về trạng thái làm bài của sinh viên
    if (!req.user.admin) {
      const quizzesWithStatus = await Promise.all(
        quizzes.map(async (quiz) => {
          const studentQuiz = await StudentQuiz.findOne({
            userId: req.user.id,
            quizId: quiz._id,
          });

          return {
            ...quiz.toObject(),
            studentStatus: studentQuiz ? studentQuiz.status : "NotStarted",
          };
        })
      );

      return res.status(200).json({
        quizzes: quizzesWithStatus,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      });
    }

    res.status(200).json({
      quizzes,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.randomQuiz = async (req, res) => {
  try {
    const { classId } = req.params;
    const { count, difficulty, category } = req.query;

    // Validate parameters
    const questionCount = parseInt(count) || 10;
    const filter = { classId };
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;

    // Get random questions
    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: questionCount } },
    ]);

    if (questions.length < questionCount) {
      return res.status(400).json({
        message: "Not enough questions matching the criteria",
      });
    }

    // Create quiz with random questions
    const quiz = await Quiz.create({
      title: `Random Quiz - ${new Date().toLocaleDateString()}`,
      classId,
      questions: questions.map((q) => q._id),
      duration: questionCount * 2, // 2 minutes per question
      status: "Draft",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      createdBy: req.user.id,
      settings: {
        shuffleQuestions: true,
      },
    });

    res.status(201).json({
      message: "Random quiz created successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getStudentQuizByUserId = async (req, res) => {
  try {
    // Lấy userId từ req.user (được thêm vào sau khi xác thực)
    const userId = req.user.id;

    // Tìm tất cả các quiz mà sinh viên đã tham gia
    const studentQuizzes = await StudentQuiz.find({ userId: userId })
      // .populate("quizzes.quizId", "title startTime endTime status") // Tùy chọn populate các thông tin quiz
      .exec();

    if (studentQuizzes.length === 0) {
      return res.status(404).json({ message: "No quizzes found for this student" });
    }

    // Trả về thông tin quiz của sinh viên
    res.status(200).json(studentQuizzes);
  } catch (error) {
    console.error("Error fetching student quizzes:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getQuizzesById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra nếu không có id trong request
    if (!id) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Tìm quiz theo ID
    const quiz = await Quiz.findById(id)

    // Kiểm tra nếu quiz không tồn tại
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({
      message: "Quiz fetched successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error fetching quiz by ID:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
