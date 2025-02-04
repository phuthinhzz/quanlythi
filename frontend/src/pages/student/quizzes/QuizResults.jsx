import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const QuizResults = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, [quizId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/students/${quizId}/result`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch results");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="text-center py-4">Loading results...</div>;
  if (error)
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded m-4">{error}</div>
    );
  if (!result) return <div className="text-center py-4">No results found</div>;

  const percentage = ((result.marksObtained / result.totalMarks) * 100).toFixed(
    1
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {result.quizId?.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500 flex items-center">
                  <svg
                    className="mr-1.5 h-5 w-5 text-gray-400"
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
                  Completed:{" "}
                  {new Date(result.submissionDetails.endTime).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => navigate("/student/quizzes")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
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
            {/* Score Overview */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-white">
                      <h3 className="text-sm font-medium opacity-80">Score</h3>
                      <p className="mt-2 text-3xl font-bold">
                        {result.marksObtained}/{result.totalMarks}
                      </p>
                    </div>
                    <div className="text-white">
                      <h3 className="text-sm font-medium opacity-80">
                        Percentage
                      </h3>
                      <p className="mt-2 text-3xl font-bold">{percentage}%</p>
                    </div>
                    <div className="text-white">
                      <h3 className="text-sm font-medium opacity-80">
                        Time Spent
                      </h3>
                      <p className="mt-2 text-3xl font-bold">
                        {Math.floor(result.submissionDetails.timeSpent / 60)}{" "}
                        mins
                      </p>
                    </div>
                    <div className="text-white">
                      <h3 className="text-sm font-medium opacity-80">Status</h3>
                      <p className="mt-2 text-3xl font-bold">{result.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                {/* Monitoring Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Monitoring Summary
                    </h2>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-red-400 mr-3"
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
                          <span className="text-gray-700">
                            Camera Violations
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          {result.violationSummary.cameraViolations}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-yellow-400 mr-3"
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
                          <span className="text-gray-700">
                            Fullscreen Violations
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          {result.violationSummary.fullscreenViolations}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-orange-400 mr-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 6h16M4 12h16M4 18h16"
                            />
                          </svg>
                          <span className="text-gray-700">Tab Switches</span>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          {result.violationSummary.tabSwitchViolations}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Analysis */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">
                  Question Analysis
                </h2>
                <div className="space-y-6">
                  {result.answers.map((answer, index) => (
                    <div
                      key={answer.questionId._id}
                      className={`rounded-lg shadow-sm border ${
                        answer.isCorrect
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-sm font-medium mr-3">
                              {index + 1}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                answer.isCorrect
                                  ? "text-green-800"
                                  : "text-red-800"
                              }`}
                            >
                              {answer.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              answer.isCorrect
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {answer.points} points
                          </span>
                        </div>

                        <p className="text-gray-900 mb-4">
                          {answer.questionId.text}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Your Answer:</span>
                            <span
                              className={
                                answer.isCorrect
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {answer.selectedOption}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time Spent:</span>
                            <span>{answer.timeSpent} seconds</span>
                          </div>
                        </div>

                        {!answer.isCorrect && answer.questionId.explanation && (
                          <div className="mt-4 p-3 bg-white rounded-md">
                            <h4 className="text-sm font-medium text-gray-900">
                              Explanation
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">
                              {answer.questionId.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
