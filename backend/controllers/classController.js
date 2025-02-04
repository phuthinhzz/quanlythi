const Class = require("../models/Class");
const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Result = require("../models/Result");
const XLSX = require("xlsx");
const { body, validationResult } = require("express-validator");

// Validate dữ liệu lớp học
exports.validateClass = [
  body("name")
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Class name must be between 3 and 50 characters"),
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Invalid start time format"),
  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("Invalid end time format")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Tạo lớp học mới
exports.createClass = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    // Kiểm tra tên lớp học đã tồn tại chưa
    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ message: "Class name already exists" });
    }

    const newClass = await Class.create({
      name,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdBy: req.user.id,
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getClassesById = async (req, res) => {
  try {
    // Tìm lớp học theo ID từ req.params.id
    const data = await Class.findById(req.params.id);

    // Kiểm tra nếu không tìm thấy lớp học
    if (!data) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Trả về dữ liệu lớp học
    res.status(200).json(data);
  } catch (error) {
    // Xử lý lỗi và trả về status 500
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách lớp học với filter và phân trang
exports.getAllClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Xây dựng query filter
    let filter = {};

    // Filter theo trạng thái (active/inactive dựa vào thời gian)
    if (req.query.status) {
      const now = new Date();
      if (req.query.status === "active") {
        filter = {
          startTime: { $lte: now },
          endTime: { $gte: now },
        };
      } else if (req.query.status === "upcoming") {
        filter = { startTime: { $gt: now } };
      } else if (req.query.status === "completed") {
        filter = { endTime: { $lt: now } };
      }
    }

    // Filter theo search term
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    // Nếu là student, chỉ lấy các lớp học mà student đó tham gia
    if (!req.user.admin) {
      filter.students = req.user.id;
    }

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate("students", "name mssv email")
        .populate("quizzes", "title startTime endTime status")
        // .populate("createdBy", "name")
        .skip(skip)
        .limit(limit)
        .sort({ startTime: -1 }),
      Class.countDocuments(filter),
    ]);

    // Thêm thông tin tổng quan cho mỗi lớp
    const classesWithStats = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = cls.students.length;
        const quizCount = cls.quizzes.length;

        // Đếm số bài quiz đang diễn ra
        const now = new Date();
        const activeQuizCount = cls.quizzes.filter(
          (quiz) =>
            quiz.status === "InProgress" ||
            (quiz.startTime <= now && quiz.endTime >= now)
        ).length;

        return {
          ...cls.toObject(),
          stats: {
            studentCount,
            quizCount,
            activeQuizCount,
          },
        };
      })
    );

    res.status(200).json({
      classes: classesWithStats,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalClasses: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin chi tiết lớp học
exports.getClassById = async (req, res) => {
  try {
    const classDetail = await Class.findById(req.params.id)
      .populate("students", "name mssv email")
      .populate({
        path: "quizzes",
        select: "title startTime endTime status duration settings",
        populate: {
          path: "questions",
          select: "text points",
        },
      })
      .populate("createdBy", "name");

    if (!classDetail) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Lấy thông tin thống kê của lớp
    const stats = {
      totalStudents: classDetail.students.length,
      totalQuizzes: classDetail.quizzes.length,
      activeQuizzes: 0,
      completedQuizzes: 0,
      upcomingQuizzes: 0,
    };

    const now = new Date();
    classDetail.quizzes.forEach((quiz) => {
      if (quiz.status === "Completed" || quiz.endTime < now) {
        stats.completedQuizzes++;
      } else if (quiz.startTime > now) {
        stats.upcomingQuizzes++;
      } else {
        stats.activeQuizzes++;
      }
    });

    res.status(200).json({
      classDetail,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Các endpoints khác được giữ nguyên...
exports.updateClass = async (req, res) => {
  try {
    console.log("req.body  ", req.body);

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body);

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Xoá lớp học
exports.deleteClass = async (req, res) => {
  try {
    // Kiểm tra xem có quiz nào đang diễn ra không
    const activeQuizzes = await Quiz.find({
      classId: req.params.id,
      status: { $in: ["Published", "InProgress"] },
    });

    if (activeQuizzes.length > 0) {
      return res.status(400).json({
        message: "Cannot delete class with active quizzes",
      });
    }

    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Xóa tất cả quiz của lớp
    await Quiz.deleteMany({ classId: req.params.id });

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm 1 sinh viên vào lớp học
exports.addStudentToClass = async (req, res) => {
  try {
    const { classId, userIds } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Kiểm tra và thêm nhiều sinh viên
    const existingStudents = new Set(
      classData.students.map((id) => id.toString())
    );
    const studentsToAdd = [];
    const errors = [];

    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (!user) {
        errors.push(`User ${userId} not found`);
        continue;
      }
      if (user.admin) {
        errors.push(`User ${userId} is an admin, cannot be added as student`);
        continue;
      }
      if (existingStudents.has(userId)) {
        errors.push(`User ${userId} is already in the class`);
        continue;
      }
      studentsToAdd.push(userId);
    }

    if (studentsToAdd.length > 0) {
      classData.students.push(...studentsToAdd);
      await classData.save();
    }

    res.status(200).json({
      message: "Students added to class",
      addedCount: studentsToAdd.length,
      errors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import sinh viên từ file Excel
exports.importStudentsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { classId } = req.body;
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const students = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: [],
      errors: [],
    };

    for (const student of students) {
      try {
        const user = await User.findOne({ mssv: student.mssv });
        if (!user) {
          results.errors.push(`Student with MSSV ${student.mssv} not found`);
          continue;
        }

        if (!classData.students.includes(user._id)) {
          classData.students.push(user._id);
          results.success.push(student.mssv);
        } else {
          results.errors.push(
            `Student with MSSV ${student.mssv} already in class`
          );
        }
      } catch (err) {
        results.errors.push(
          `Error processing MSSV ${student.mssv}: ${err.message}`
        );
      }
    }

    await classData.save();

    // Xóa file sau khi xử lý
    require("fs").unlinkSync(req.file.path);

    res.status(200).json({
      message: "Import completed",
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xem thống kê bài kiểm tra của lớp
exports.getClassQuizStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const quizzes = await Quiz.find({ classId });

    const quizStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const results = await Result.find({ quizId: quiz._id });

        const stats = {
          quizId: quiz._id,
          title: quiz.title,
          totalStudents: results.length,
          averageScore: 0,
          passRate: 0,
          highestScore: 0,
          lowestScore: results.length > 0 ? Infinity : 0,
        };

        if (results.length > 0) {
          const scores = results.map((r) => r.marksObtained);
          stats.averageScore = scores.reduce((a, b) => a + b) / scores.length;
          stats.passRate =
            (results.filter((r) => r.status === "Passed").length /
              results.length) *
            100;
          stats.highestScore = Math.max(...scores);
          stats.lowestScore = Math.min(...scores);
        }

        return stats;
      })
    );

    res.status(200).json(quizStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xem sinh viên đang làm bài trong lớp
exports.getActiveStudents = async (req, res) => {
  try {
    const { classId } = req.params;

    const activeQuizzes = await Quiz.find({
      classId,
      status: "InProgress",
    });

    const activeStudents = await StudentQuiz.find({
      quizId: { $in: activeQuizzes.map((q) => q._id) },
      status: "InProgress",
    })
      .populate("userId", "name mssv")
      .populate("quizId", "title");

    res.status(200).json(activeStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa sinh viên khỏi lớp học
exports.removeStudentFromClass = async (req, res) => {
  try {
    const { id, studentId } = req.body;
    console.log("classId", id)

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Kiểm tra sinh viên có trong lớp không
    if (!classData.students.includes(studentId)) {
      return res.status(400).json({ message: "Student not in class" });
    }

    // Xóa sinh viên khỏi lớp
    classData.students = classData.students.filter(
      (id) => id.toString() !== studentId
    );
    await classData.save();

    // Kiểm tra xem sinh viên có đang làm bài thi nào trong lớp không
    const activeQuizzes = await Quiz.find({
      id,
      status: "InProgress",
    });

    // Hủy các phiên làm bài của sinh viên trong lớp nếu có
    if (activeQuizzes.length > 0) {
      await StudentQuiz.updateMany(
        {
          userId: studentId,
          quizId: { $in: activeQuizzes.map((q) => q._id) },
          status: "InProgress",
        },
        {
          status: "Terminated",
          endTime: new Date(),
        }
      );
    }

    res.status(200).json({
      message: "Student removed from class successfully",
      updatedClass: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách sinh viên trong lớp
exports.getStudentsInClass = async (req, res) => {
  try {
    const { id } = req.params; // id của lớp

    const classData = await Class.findById(id).populate({
      path: "students",
      select: "name mssv email", // Chỉ lấy các trường cần thiết của user
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const students = classData.students;

    // Lấy thông tin điểm và kết quả làm bài của sinh viên trong lớp
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        // Lấy danh sách quiz của lớp
        const quizzes = await Quiz.find({ classId: id });

        // Lấy kết quả của sinh viên cho các quiz
        const results = await Result.find({
          userId: student._id,
          quizId: { $in: quizzes.map((q) => q._id) },
        });

        // Tính toán thống kê
        const stats = {
          totalQuizzes: quizzes.length,
          completedQuizzes: results.length,
          averageScore: 0,
          passedQuizzes: 0,
        };

        if (results.length > 0) {
          stats.averageScore =
            results.reduce((sum, r) => sum + r.marksObtained, 0) /
            results.length;
          stats.passedQuizzes = results.filter(
            (r) => r.status === "Passed"
          ).length;
        }

        // Kiểm tra sinh viên có đang làm bài nào không
        const activeQuiz = await StudentQuiz.findOne({
          userId: student._id,
          quizId: { $in: quizzes.map((q) => q._id) },
          status: "InProgress",
        }).populate("quizId", "title");

        return {
          _id: student._id,
          name: student.name,
          mssv: student.mssv,
          email: student.email,
          stats,
          currentQuiz: activeQuiz
            ? {
              quizTitle: activeQuiz.quizId.title,
              startTime: activeQuiz.startTime,
            }
            : null,
        };
      })
    );

    res.status(200).json({
      classId: id,
      className: classData.name,
      totalStudents: students.length,
      students: studentsWithStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// classController.js
exports.getClassesForStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy danh sách lớp học của sinh viên
    const [classes, total] = await Promise.all([
      Class.find({ students: userId })
        .populate("quizzes", "title startTime endTime status")
        .skip(skip)
        .limit(limit)
        .sort({ startTime: -1 }),
      Class.countDocuments({ students: userId }),
    ]);

    // Lấy thông tin bài thi cho mỗi lớp
    const classesWithQuizInfo = await Promise.all(
      classes.map(async (cls) => {
        // Đếm số bài quiz theo trạng thái
        const now = new Date();
        const quizStats = {
          total: cls.quizzes.length,
          active: cls.quizzes.filter(
            (q) =>
              q.status === "InProgress" &&
              q.startTime <= now &&
              q.endTime >= now
          ).length,
          upcoming: cls.quizzes.filter((q) => q.startTime > now).length,
          completed: cls.quizzes.filter(
            (q) => q.status === "Completed" || q.endTime < now
          ).length,
        };

        // Lấy kết quả của sinh viên trong lớp
        const results = await Result.find({
          userId,
          quizId: { $in: cls.quizzes.map((q) => q._id) },
        });

        const studentStats = {
          totalAttempts: results.length,
          averageScore:
            results.length > 0
              ? results.reduce((sum, r) => sum + r.marksObtained, 0) /
              results.length
              : 0,
          passedQuizzes: results.filter((r) => r.status === "Passed").length,
        };

        return {
          ...cls.toObject(),
          quizStats,
          studentStats,
        };
      })
    );

    res.status(200).json({
      classes: classesWithQuizInfo,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.importClassesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const classData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: [],
      errors: [],
    };

    for (const cls of classData) {
      try {
        // Validate dữ liệu
        if (!cls.name || !cls.startTime || !cls.endTime) {
          results.errors.push({
            name: cls.name,
            error: "Missing required fields",
          });
          continue;
        }

        // Kiểm tra tên lớp trùng
        const existingClass = await Class.findOne({ name: cls.name });
        if (existingClass) {
          results.errors.push({
            name: cls.name,
            error: "Class name already exists",
          });
          continue;
        }

        // Parse thời gian
        const startTime = new Date(cls.startTime);
        const endTime = new Date(cls.endTime);

        if (startTime >= endTime) {
          results.errors.push({
            name: cls.name,
            error: "End time must be after start time",
          });
          continue;
        }

        // Tạo lớp mới
        const newClass = await Class.create({
          name: cls.name,
          startTime,
          endTime,
          createdBy: req.user.id,
        });

        results.success.push(newClass.name);
      } catch (error) {
        results.errors.push({
          name: cls.name,
          error: error.message,
        });
      }
    }

    // Xóa file sau khi import
    require("fs").unlinkSync(req.file.path);

    res.status(200).json({
      message: "Import completed",
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStudentsToClassFromExcel = async (req, res) => {
  try {
    const { id } = req.params; // class id
    // console.log(req.file)
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const studentData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = {
      success: [],
      errors: [],
    };

    // Set để theo dõi sinh viên đã có trong lớp
    const existingStudents = new Set(
      classData.students.map((id) => id.toString())
    );

    for (const student of studentData) {
      try {
        if (!student.mssv) {
          results.errors.push({
            mssv: "N/A",
            error: "Missing MSSV",
          });
          continue;
        }

        // Tìm user theo MSSV
        const user = await User.findOne({ mssv: student.mssv });
        if (!user) {
          results.errors.push({
            mssv: student.mssv,
            error: "Student not found",
          });
          continue;
        }

        // Kiểm tra sinh viên đã có trong lớp chưa
        if (existingStudents.has(user._id.toString())) {
          results.errors.push({
            mssv: student.mssv,
            error: "Student already in class",
          });
          continue;
        }

        // Thêm sinh viên vào lớp
        classData.students.push(user._id);
        existingStudents.add(user._id.toString());
        results.success.push(student.mssv);
      } catch (error) {
        results.errors.push({
          mssv: student.mssv,
          error: error.message,
        });
      }
    }

    // Lưu thay đổi
    await classData.save();

    // Xóa file sau khi import
    require("fs").unlinkSync(req.file.path);

    res.status(200).json({
      message: "Students added successfully",
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getStudentByClassId = async (req, res) => {
  try {
    const classId = req.params.id;

    // Tìm thông tin lớp học
    const classData = await Class.findById(classId).populate("students");
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Lấy danh sách sinh viên từ lớp học
    const students = classData.students;
    // console.log("classData", classData)

    res.status(200).json({
      classData: {
        _id: classData._id,
        name: classData.name,
        quizzes: classData.quizzes,
      },
      students: students,
    });
  } catch (error) {
    console.error("Error fetching students by class ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.getClassByUserId = async (req, res) => {
  try {
    // Lấy userId từ req.user (được thêm vào sau khi xác thực)
    const userId = req.user.id;

    // Tìm tất cả các lớp học mà user tham gia (tìm lớp học có userId trong mảng students)
    const classes = await Class.find({
      students: userId,
    }).populate("quizzes", "title startTime endTime"); // Tùy chọn populate các bài kiểm tra (nếu cần)

    if (classes.length === 0) {
      return res
        .status(404)
        .json({ message: "No classes found for this user" });
    }

    // Trả về thông tin lớp học
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Server error" });
  }
};
