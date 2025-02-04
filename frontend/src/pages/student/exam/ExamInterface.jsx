import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import QuestionDisplay from "./QuestionDisplay";
import CameraStream from "./CameraStream";

import Timer from "./Timer";
import Modal from "react-modal";
import UserView from "../../admin/monitoring/UserView";
const socket = io("http://localhost:5000");
const ExamInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullscreenCount, setFullscreenCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [cheatingMessage, setCheatingMessage] = useState("");
  const [settings, setSettings] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showStartModal, setShowStartModal] = useState(true);

  const isCameraEnabled = settings?.requireCamera ?? true;
  const isFullscreenRequired = settings?.requireFullscreen ?? true;
  const isTabChangeAllowed = settings?.allowTabChange ?? false;
  const shuffleQuestions = settings?.shuffleQuestions ?? false;
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("username");
  useEffect(() => {
    const ren = async () => {
      await startQuiz();
      if (isCameraEnabled) {
        await startCamera();
      }
    };
    ren();

    return () => {
      exitFullscreen();
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [quizId, isCameraEnabled, isFullscreenRequired]);

  useEffect(() => {
    if (shuffleQuestions && quiz?.questions) {
      setQuestions(shuffleArray(quiz.questions));
    } else {
      setQuestions(quiz?.questions ?? []);
    }
  }, [quiz, shuffleQuestions]);

  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };
  const requestFullscreen = async () => {
    const element = document.documentElement;

    try {
      // Kiểm tra và yêu cầu vào chế độ toàn màn hình
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        // Firefox
        await element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        // Safari
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        // IE
        await element.msRequestFullscreen();
      }
    } catch (error) {
      console.error("Error requesting fullscreen:", error);
    }
  };
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  const startCamera = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "camera",
      });
      if (permissionStatus.state === "granted") {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setCameraStream(stream);
      } else {
        setCheatingMessage(
          "Camera access denied. Please check your camera permissions."
        );
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      setCheatingMessage(
        "Camera access failed. Please ensure your camera is connected."
      );
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibility changed:", {
        isHidden: document.hidden,
        visibilityState: document.visibilityState,
        isTabChangeAllowed,
        currentCount: tabSwitchCount,
      });

      // Changed condition: increment when hidden and tab changes are NOT allowed
      if (document.visibilityState === "hidden" && !isTabChangeAllowed) {
        setTabSwitchCount((prevCount) => {
          const newCount = prevCount + 1;
          socket.emit("user-blur", { userName });
          console.log("Incrementing tab switch count to:", newCount);
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isTabChangeAllowed, tabSwitchCount]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenCount((prev) => prev + 1);
        console.log("Fullscreen was exited!");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreenRequired]);
  useEffect(() => {
    const handleEndExam = async () => {
      console.log("meomeomeo");
      const resultData = {
        answers,
        fullscreenCount,
        tabSwitchCount,
      };
      console.log("resultData", resultData);

      const response = await fetch(
        `http://localhost:8000/v1/admin/results/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(resultData),
        }
      );

      if (!response.ok) throw new Error("Failed to submit quiz");
      navigate("/student/dashboard");
    };
    socket.on("admin-end-your-exam", handleEndExam);
    return () => {
      socket.off("admin-end-your-exam", handleEndExam);
    };
  }, []);
  // useEffect(() => {
  //   window.addEventListener("blur", () => {
  //     console.log("bhjasdasd");
  //     socket.emit("user-blur", { userId, userName });
  //   });
  //   return () => {
  //     window.removeEventListener("blur", () => {
  //       socket.emit("user-blur", { userId, userName });
  //     });
  //   };
  // }, []);

  const startQuiz = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:8000/v1/quizzes/start/${quizId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start quiz");
      }

      const data = await response.json();
      setQuiz(data.quiz);
      setSettings(data.quiz.settings);
      initializeAnswers(data.quiz.questions);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const initializeAnswers = (questions) => {
    const initialAnswers = {};
    questions.forEach((q) => {
      initialAnswers[q._id] = {
        selectedOption: null,
        timeSpent: 0,
        startTime: new Date(),
      };
    });
    setAnswers(initialAnswers);
  };
  const handleAnswerSelect = (questionId, option) => {
    const now = new Date();
    const timeSpent = Math.floor((now - answers[questionId].startTime) / 1000);

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOption: option,
        timeSpent,
      },
    }));

    // Save answer to server
    saveAnswer(questionId, option, timeSpent);
  };

  const saveAnswer = async (questionId, selectedOption, timeSpent) => {
    try {
      await fetch(`http://localhost:8000/v1/answer/students/${quizId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          questionId,
          selectedOption,
          timeSpent,
        }),
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsModalOpen(true);
  };
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      const resultData = {
        answers,
        fullscreenCount,
        tabSwitchCount,
      };
      console.log("resultData", resultData);

      const response = await fetch(
        `http://localhost:8000/v1/admin/results/${quizId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(resultData),
        }
      );

      if (!response.ok) throw new Error("Failed to submit quiz");

      navigate("/student/quizzes");
    } catch (error) {
      setError("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };
  const handleCancelSubmit = () => {
    setIsModalOpen(false);
  };
  const handleStartExam = async () => {
    if (isFullscreenRequired) {
      await requestFullscreen();
    }
    setShowStartModal(false);
  };
  if (loading) {
    return <div className="text-center py-4">Loading exam...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded m-4">{error}</div>
    );
  }

  if (!quiz) {
    return <div className="text-center py-4">Quiz not found</div>;
  }

  if (showStartModal) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Ready to Start the Exam?</h2>
          <p className="mb-4">
            By starting this exam, you agree to the following:
            {isFullscreenRequired && (
              <li>The exam will run in fullscreen mode</li>
            )}
            {isCameraEnabled && (
              <li>Your camera will be enabled during the exam</li>
            )}
          </p>
          <button
            onClick={handleStartExam}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900 text-center">
              Ready to Start the Exam?
            </h2>
            <div className="mt-4 space-y-3">
              {isFullscreenRequired && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  <span>The exam will run in fullscreen mode</span>
                </div>
              )}
              {isCameraEnabled && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Your camera will be enabled during the exam</span>
                </div>
              )}
            </div>
            <button
              onClick={handleStartExam}
              className="mt-6 w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Start Exam
              <svg
                className="ml-2 -mr-1 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCancelSubmit}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900 text-center">
            Submit Quiz?
          </h3>
          <p className="mt-2 text-sm text-gray-500 text-center">
            Are you sure you want to submit? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              onClick={handleCancelSubmit}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white 
                ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? "Submitting..." : "Yes, submit quiz"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="sticky top-0 bg-white border-b z-50">
        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <svg
                className="h-5 w-5 text-red-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-medium text-red-800">
                Do not close or navigate away from this page. Doing so will
                result in quiz termination.
              </p>
            </div>
          </div>
        </div>

        {/* Quiz Header */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-500 flex items-center">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </p>
            </div>
            <Timer
              duration={quiz.duration}
              onTimeUp={handleSubmit}
              className="text-2xl font-mono font-bold text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Questions */}
          <div className="lg:col-span-2 space-y-6">
            <QuestionDisplay
              question={quiz.questions[currentQuestion]}
              selectedOption={
                answers[quiz.questions[currentQuestion]._id]?.selectedOption
              }
              onSelectOption={handleAnswerSelect}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <button
                onClick={() =>
                  setCurrentQuestion((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestion === 0}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentQuestion((prev) =>
                    Math.min(quiz.questions.length - 1, prev + 1)
                  )
                }
                disabled={currentQuestion === quiz.questions.length - 1}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <svg
                  className="h-5 w-5 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Submit Quiz
              <svg
                className="ml-2 -mr-1 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Camera Feed */}
            {isCameraEnabled && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-sm font-medium text-gray-900">
                    Camera Feed
                  </h2>
                </div>
                <UserView socket={socket} roomId={quizId} />
              </div>
            )}

            {/* Question Navigator */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">
                  Question Navigator
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {quiz.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`
                        h-10 w-full rounded-md text-sm font-medium transition-all
                        ${
                          answers[quiz.questions[index]._id]?.selectedOption
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }
                        ${currentQuestion === index && "ring-2 ring-blue-500"}
                      `}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Violations Counter */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-medium text-gray-900">
                  Monitoring Status
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Fullscreen Exits
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      fullscreenCount > 0
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {fullscreenCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tab Switches</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tabSwitchCount > 0
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {tabSwitchCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
