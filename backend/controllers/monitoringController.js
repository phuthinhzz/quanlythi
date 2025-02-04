// monitoringController.js
const StudentQuiz = require("../models/StudentQuiz.js");

exports.getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await StudentQuiz.find({
      status: "InProgress",
    })
      .populate("userId", "name mssv")
      .populate("quizId", "title")
      .select("monitoringData startTime");

    res.status(200).json(activeSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveSessionsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const activeSessions = await StudentQuiz.find({
      status: "InProgress",
      "quizId.classId": classId,
    })
      .populate("userId", "name mssv")
      .populate({
        path: "quizId",
        select: "title classId",
        match: { classId: classId },
      })
      .select("monitoringData startTime");

    res.status(200).json(activeSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveSessionsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const activeSessions = await StudentQuiz.find({
      quizId,
      status: "InProgress",
    })
      .populate("userId", "name mssv")
      .populate("quizId", "title")
      .select("monitoringData startTime");

    res.status(200).json(activeSessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentMonitoringDetail = async (req, res) => {
  try {
    const studentQuiz = await StudentQuiz.findById(req.params.studentQuizId)
      .populate("userId", "name mssv")
      .populate("quizId", "title duration")
      .select("monitoringData startTime status");

    if (!studentQuiz) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(studentQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getViolationStats = async (req, res) => {
  try {
    const stats = await StudentQuiz.aggregate([
      {
        $match: { status: "InProgress" },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          cameraViolations: {
            $sum: {
              $size: {
                $filter: {
                  input: "$monitoringData.violations",
                  as: "violation",
                  cond: { $eq: ["$$violation.type", "CameraOff"] },
                },
              },
            },
          },
          fullscreenViolations: {
            $sum: {
              $size: {
                $filter: {
                  input: "$monitoringData.violations",
                  as: "violation",
                  cond: { $eq: ["$$violation.type", "FullscreenExit"] },
                },
              },
            },
          },
          tabSwitches: { $sum: "$monitoringData.tabSwitchCount" },
        },
      },
    ]);

    res.status(200).json(
      stats[0] || {
        totalSessions: 0,
        cameraViolations: 0,
        fullscreenViolations: 0,
        tabSwitches: 0,
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.terminateSession = async (req, res) => {
  try {
    const studentQuiz = await StudentQuiz.findById(req.params.studentQuizId);

    if (!studentQuiz) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (studentQuiz.status !== "InProgress") {
      return res.status(400).json({ message: "Session is not in progress" });
    }

    studentQuiz.status = "Terminated";
    studentQuiz.endTime = new Date();
    await studentQuiz.save();

    res.status(200).json({
      message: "Session terminated successfully",
      studentQuiz,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getLiveMonitoring = async (req, res) => {
  try {
    const { classId } = req.params;

    // Lấy danh sách quiz đang diễn ra trong lớp
    const activeQuizzes = await Quiz.find({
      classId,
      status: "InProgress",
    });

    // Lấy thông tin chi tiết về các phiên làm bài
    const sessions = await Promise.all(
      activeQuizzes.map(async (quiz) => {
        const studentSessions = await StudentQuiz.find({
          quizId: quiz._id,
          status: "InProgress",
        })
          .populate("userId", "name mssv")
          .select("monitoringData startTime");

        return {
          quizId: quiz._id,
          quizTitle: quiz.title,
          activeSessions: studentSessions.map((session) => ({
            sessionId: session._id,
            student: session.userId,
            startTime: session.startTime,
            monitoringData: {
              cameraEnabled: session.monitoringData.cameraEnabled,
              isFullscreen: session.monitoringData.isFullscreen,
              tabSwitchCount: session.monitoringData.tabSwitchCount,
              violations: session.monitoringData.violations,
            },
          })),
        };
      })
    );

    // Tính toán thống kê vi phạm
    const violationStats = {
      totalActiveSessions: 0,
      cameraViolations: 0,
      fullscreenViolations: 0,
      tabSwitches: 0,
    };

    sessions.forEach((quiz) => {
      quiz.activeSessions.forEach((session) => {
        violationStats.totalActiveSessions++;
        violationStats.cameraViolations +=
          session.monitoringData.violations.filter(
            (v) => v.type === "CameraOff"
          ).length;
        violationStats.fullscreenViolations +=
          session.monitoringData.violations.filter(
            (v) => v.type === "FullscreenExit"
          ).length;
        violationStats.tabSwitches += session.monitoringData.tabSwitchCount;
      });
    });

    res.status(200).json({
      sessions,
      violationStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
