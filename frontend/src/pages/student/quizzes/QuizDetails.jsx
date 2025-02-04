import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const QuizDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuizDetails();
  }, [id]);

  const fetchQuizDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch quiz details");
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      setError("Failed to load quiz details");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes/${id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to start quiz");

      navigate(`/student/exam/${id}`);
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading)
    return <div className="text-center py-4">Loading quiz details...</div>;
  if (error)
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded m-4">{error}</div>
    );
  if (!quiz) return <div className="text-center py-4">Quiz not found</div>;

  const now = new Date();
  const startTime = new Date(quiz.startTime);
  const endTime = new Date(quiz.endTime);
  const canStart =
    now >= startTime && now <= endTime && quiz.status === "Published";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {quiz.title}
                </h1>
                <p className="mt-1 text-sm font-medium text-blue-600">
                  {quiz.classId?.name}
                </p>
              </div>
              <button
                onClick={() => navigate("/student/quizzes")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="mr-2 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Quizzes
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Quiz Information */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Quiz Information
                    </h3>
                    <div className="mt-5 grid grid-cols-1 gap-5">
                      <div className="flex items-center text-sm">
                        <svg
                          className="mr-3 h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {quiz.duration} minutes
                        </span>
                      </div>

                      <div className="flex items-center text-sm">
                        <svg
                          className="mr-3 h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-gray-600">Start Time:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {startTime.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center text-sm">
                        <svg
                          className="mr-3 h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-gray-600">End Time:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {endTime.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center text-sm">
                        <svg
                          className="mr-3 h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span className="text-gray-600">Total Questions:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {quiz.questions?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quiz Settings */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Quiz Settings
                    </h3>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-4 w-4 rounded-full ${
                            quiz.settings.requireCamera
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Camera Required
                        </span>
                      </div>

                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-4 w-4 rounded-full ${
                            quiz.settings.requireFullscreen
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Fullscreen Required
                        </span>
                      </div>

                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-4 w-4 rounded-full ${
                            quiz.settings.notallowTabChange
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Tab Change Not Allowed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-blue-400"
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
                      <h3 className="ml-3 text-lg font-medium text-blue-900">
                        Instructions
                      </h3>
                    </div>
                    <div className="mt-5 text-sm text-blue-800">
                      <ul className="space-y-3">
                        {[
                          "Ensure you have a stable internet connection",
                          "Make sure your webcam is working properly",
                          "You cannot pause the quiz once started",
                          "Answer all questions before time runs out",
                          "Stay in fullscreen mode during the quiz",
                        ].map((instruction, index) => (
                          <li key={index} className="flex items-start">
                            <svg
                              className="h-5 w-5 text-blue-400 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Start Quiz Button or Message */}
                {canStart ? (
                  <button
                    onClick={startQuiz}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Start Quiz
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
                ) : (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
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
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          {now < startTime
                            ? "Quiz hasn't started yet"
                            : now > endTime
                            ? "Quiz has ended"
                            : "Quiz is not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetails;
