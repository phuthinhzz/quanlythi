import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
const QuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("upcoming"); // upcoming, active, completed

  useEffect(() => {
    fetchQuizzes();
  }, [filter]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/students/quizzes?filter=${filter}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      setQuizzes(data.quizzes);
    } catch (error) {
      setError("Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const getQuizStatus = (quiz) => {
    // Giả sử status là một đối tượng có cấu trúc như sau
    const { studentStatus, status: quizStatus } = quiz;
    const { color, text, action, className } = quizStatus || {};

    return {
      status: studentStatus || "Not Started", // nếu không có studentStatus thì mặc định là Not Started
      color,
      text,
      action,
      className,
    };
  };
  // const handleStartQuiz = async () => {
  //   try {
  //     await fetch(
  //       `http://localhost:8000/v1/students/quizzes/update-status-quiz`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  //         },
  //       }
  //     );
  //   } catch (error) {
  //     setError("Failed to fetch quizzes");
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your quiz assignments
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-8 inline-flex">
          {["upcoming", "active", "completed"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-6 py-2.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === filterType
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {quizzes?.map((quiz) => {
              const status = getQuizStatus(quiz);

              return (
                <div
                  key={quiz._id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {quiz.title}
                        </h3>
                        <p className="text-sm font-medium text-blue-600">
                          {quiz.classId?.name}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
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
                            Start: {new Date(quiz.startTime).toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
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
                            Duration: {quiz.duration} minutes
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
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
                            End: {new Date(quiz.endTime).toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            Class: {status.className}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <span
                          className={`${status.color} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {status.text}
                        </span>
                        <span
                          className={`${status.color} px-3 py-1 rounded-full text-sm font-medium`}
                        >
                          {status.status}
                        </span>
                      </div>
                    </div>

                    {quiz.result && (
                      <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Quiz Results
                        </h4>
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-gray-500">Score</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              {quiz.result.score}/{quiz.result.totalMarks}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Percentage</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">
                              {(
                                (quiz.result.score / quiz.result.totalMarks) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p
                              className={`mt-1 text-2xl font-bold ${
                                quiz.result.status === "Passed"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {quiz.result.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {status.action && (
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: "Xác nhận làm bài!",
                              text: "Sau khi chọn thì sẽ không được quay lại!",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#3085d6",
                              cancelButtonColor: "#d33",
                              confirmButtonText: "Yes",
                              cancelButtonText: "No",
                            }).then((result) => {
                              if (result.isConfirmed) {
                                navigate(
                                  status.action === "Start Quiz"
                                    ? `/student/exam/${quiz._id}`
                                    : `/student/quiz/${quiz._id}/result`
                                );
                              }
                            });
                          }}
                          className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            status.status !== "Submitted" &&
                            status.status !== "InProgress"
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "border border-blue-500 text-blue-500 hover:bg-blue-50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {status.action}
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
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {!loading && quizzes.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {filter} quizzes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new quizzes
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizList;
