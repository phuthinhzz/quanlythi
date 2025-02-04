const Question = require("../models/Question");
const Quiz = require("../models/Quiz");
const Class = require("../models/Class"); // Ensure Class model is imported
const { body, validationResult } = require("express-validator");
const xlsx = require("xlsx");
const XLSX = require("xlsx");

// Middleware xác thực dữ liệu
exports.validateQuestion = [
  body("text").notEmpty().withMessage("Question text is required"),
  body("options")
    .isArray({ min: 2 })
    .withMessage("Options must be an array with at least two elements"),
  body("options.*.text").notEmpty().withMessage("Option text is required"),
  body("options.*.isCorrect")
    .isBoolean()
    .withMessage("Each option must have a boolean isCorrect field"),
  body("points").isInt({ min: 1 }).withMessage("Points must be at least 1"),
  body("difficulty")
    .isIn(["Easy", "Medium", "Hard"])
    .withMessage("Invalid difficulty level"),
  body("category").notEmpty().withMessage("Category is required"),
  body("classId").notEmpty().withMessage("Class ID is required"),
  body("timeLimit")
    .optional()
    .isInt({ min: 10 })
    .withMessage("Time limit must be at least 10 seconds"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

exports.getAllQuestionsNotQuery = async (req, res) => {
  try {
    // Lấy tất cả câu hỏi từ cơ sở dữ liệu
    const questions = await Question.find();

    // Kiểm tra nếu không có câu hỏi nào trong cơ sở dữ liệu
    if (questions.length === 0) {
      return res.status(404).json({
        message: "No questions found",
      });
    }

    // Trả về danh sách câu hỏi
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);

    // Xử lý lỗi
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Tạo câu hỏi mới
exports.createQuestion = async (req, res) => {
  try {
    const questionData = {
      ...req.body,
      createdBy: req.user.id, // Lấy ID của admin từ JWT token
      status: req.body.status || "Active",
    };

    const newQuestion = await Question.create(questionData);
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả câu hỏi với bộ lọc và phân trang
exports.getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Xây dựng query filter
    const filter = {};
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.classId) filter.classId = req.query.classId;

    // Thực hiện query với filter
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("createdBy", "name")
        .populate("classId", "name")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Question.countDocuments(filter),
    ]);

    res.status(200).json({
      questions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalQuestions: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tìm kiếm câu hỏi nâng cao
exports.searchQuestions = async (req, res) => {
  try {
    const {
      keyword,
      difficulty,
      category,
      status,
      createdBy,
      dateFrom,
      dateTo,
      minPoints,
      maxPoints,
    } = req.query;

    let query = {};

    // Xây dựng query dựa trên các tham số tìm kiếm
    if (keyword) {
      query.text = { $regex: keyword, $options: "i" };
    }
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    if (minPoints || maxPoints) {
      query.points = {};
      if (minPoints) query.points.$gte = parseInt(minPoints);
      if (maxPoints) query.points.$lte = parseInt(maxPoints);
    }

    const questions = await Question.find(query)
      .populate("createdBy", "name")
      .populate("classId", "name");

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import câu hỏi từ file Excel
exports.importQuestionsFromExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const questionData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const questions = [];
    const errors = [];

    for (const row of questionData) {
      try {
        // Validate dữ liệu từ Excel
        if (!row.text || !row.options || !row.category) {
          errors.push(`Row ${questions.length + 1}: Missing required fields`);
          continue;
        }

        // Parse options từ chuỗi JSON hoặc format tùy chọn
        let options;
        try {
          options = JSON.parse(row.options);
        } catch {
          errors.push(`Row ${questions.length + 1}: Invalid options format`);
          continue;
        }

        // Tạo object câu hỏi
        const question = {
          text: row.text,
          options,
          points: row.points || 1,
          difficulty: row.difficulty || "Medium",
          category: row.category,
          classId: req.body.classId,
          createdBy: req.user.id,
          timeLimit: row.timeLimit || 60,
          explanation: row.explanation,
          status: "Active",
        };

        questions.push(question);
      } catch (err) {
        errors.push(`Row ${questions.length + 1}: ${err.message}`);
      }
    }

    // Lưu các câu hỏi hợp lệ vào database
    if (questions.length > 0) {
      await Question.insertMany(questions);
    }

    // Xóa file sau khi import
    require("fs").unlinkSync(req.file.path);

    res.status(201).json({
      message: "Import completed",
      success: questions.length,
      errors,
      total: questionData.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật trạng thái câu hỏi
exports.updateQuestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive", "Draft"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const question = await Question.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật câu hỏi
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Ghi nhận lịch sử thay đổi nếu cần
    if (req.body.options) {
      question.usage = {
        ...question.usage,
        lastModified: new Date(),
      };
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa câu hỏi
exports.deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;

    // Kiểm tra xem câu hỏi có đang được sử dụng trong quiz nào không
    const quiz = await Quiz.findOne({ questions: questionId });
    if (quiz) {
      return res.status(400).json({
        message: "Question cannot be deleted as it is linked to a quiz",
      });
    }

    const deletedQuestion = await Question.findByIdAndDelete(questionId);
    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thống kê về câu hỏi
exports.getQuestionStats = async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          avgPoints: { $avg: "$points" },
          byDifficulty: {
            $push: {
              difficulty: "$difficulty",
              count: 1,
            },
          },
          byCategory: {
            $push: {
              category: "$category",
              count: 1,
            },
          },
        },
      },
    ]);

    res.status(200).json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết câu hỏi
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("classId", "name");

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy câu hỏi theo bài thi
exports.getQuestionsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const questions = await Question.find({
      _id: { $in: quiz.questions },
    })
      .select("text options points difficulty timeLimit")
      .sort("createdAt");

    res.status(200).json({
      quizId,
      questionCount: questions.length,
      questions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getQuestionsByCategory = async (req, res) => {
  try {
    const { category, difficulty, classId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Xây dựng query filter
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (classId) filter.classId = classId;

    // Nếu là admin thì có thể thấy tất cả câu hỏi, sinh viên chỉ thấy câu hỏi active
    if (!req.user.admin) {
      filter.status = "Active";
      // Sinh viên chỉ thấy câu hỏi của lớp mình tham gia
      const classes = await Class.find({ students: req.user.id });
      filter.classId = { $in: classes.map((c) => c._id) };
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("createdBy", "name")
        .populate("classId", "name")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Question.countDocuments(filter),
    ]);

    // Nếu là sinh viên, ẩn đáp án đúng
    if (!req.user.admin) {
      questions.forEach((question) => {
        question.options = question.options.map((opt) => ({
          text: opt.text,
          isCorrect: undefined,
        }));
      });
    }

    res.status(200).json({
      questions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addQuestionsFromExcel = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const questionData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    console.log("Parsed question data:", questionData); // Log the parsed data

    const results = {
      success: [],
      errors: [],
    };

    for (const row of questionData) {
      try {
        // Validate dữ liệu cơ bản
        if (!row.text || !row.options || !row.category || !row.classId) {
          results.errors.push({
            text: row.text || "Unknown",
            error: "Missing required fields",
          });
          continue;
        }

        console.log("Processing row:", row); // Log each row being processed

        // Kiểm tra nếu text đã tồn tại
        const existingQuestion = await Question.findOne({ text: row.text });
        if (existingQuestion) {
          results.errors.push({
            text: row.text,
            error: "Question with this text already exists",
          });
          continue;
        }

        // Parse options từ string JSON
        let options;
        try {
          options = JSON.parse(row.options);
          if (!Array.isArray(options) || options.length < 2) {
            throw new Error("Options must be an array with at least 2 items");
          }
          if (!options.some((opt) => opt.isCorrect)) {
            throw new Error("At least one option must be correct");
          }
        } catch (err) {
          results.errors.push({
            text: row.text,
            error: `Invalid options format: ${err.message}`,
          });
          continue;
        }

        // Kiểm tra class tồn tại
        const classExists = await Class.findById(row.classId);
        if (!classExists) {
          results.errors.push({
            text: row.text,
            error: "Class not found",
          });
          continue;
        }

        // Tạo câu hỏi mới
        const newQuestion = await Question.create({
          text: row.text,
          options,
          points: row.points || 1,
          difficulty: row.difficulty || "Medium",
          category: row.category,
          classId: row.classId,
          createdBy: req.user.id,
          timeLimit: row.timeLimit || 60,
          explanation: row.explanation,
          status: "Active",
          usage: row.usage,
        });

        results.success.push(newQuestion._id);
      } catch (error) {
        results.errors.push({
          text: row.text,
          error: error.message,
        });
      }
    }

    // Xóa file sau khi import
    require("fs").unlinkSync(req.file.path);

    res.status(201).json({
      message: "Import completed",
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

