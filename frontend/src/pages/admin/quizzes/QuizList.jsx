import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const QuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: "",
    classId: "",
    search: "",
  });

  useEffect(() => {
    fetchQuizzes();
    quizzes.forEach((quiz) => {
      if (quiz.status !== "Completed") {
        handleStatusChange(quiz._id);
      }
    });
  }, [currentPage, filter]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        status: filter.status,
        classId: filter.classId,
        search: filter.search,
      });

      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      setQuizzes(data.quizzes);
      setTotalPages(data.totalPages);

      // Gọi handleStatusChange tuần tự với setTimeout
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quizId) => {
    try {
      const response = await fetch(
        "http://localhost:8000/v1/admin/quizzes/update-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            quizId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");
      console.log("Status updated successfully");
      fetchQuizzes(); // Gọi lại để làm mới danh sách
    } catch (error) {
      console.error("Error updating quiz status:", error);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes/${quizId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete quiz");
      fetchQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-100 text-gray-800",
      Published: "bg-blue-100 text-blue-800",
      InProgress: "bg-green-100 text-green-800",
      Completed: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };
  const handleLogout = () => {
    // Clear access token from local storage
    localStorage.removeItem("accessToken");
    // Navigate to login page
    navigate("/login");
  };
  return (
    <div>
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="text-white font-bold text-xl hover:text-gray-200 transition duration-200"
                >
                  AdminDashboard
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Quiz Management</h1>
          <button
            onClick={() => navigate("create")}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition duration-200 font-medium flex items-center gap-2"
          >
            Create Quiz
          </button>
        </div>

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search quizzes..."
            value={filter.search}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value }))
            }
            className="border border-gray-300 p-3 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          />
          <select
            value={filter.status}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, status: e.target.value }))
            }
            className="border border-gray-300 p-3 rounded-lg w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Start Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    End Time
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Questions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quizzes?.map((quiz) => (
                  <tr
                    key={quiz._id}
                    className="hover:bg-gray-50 transition duration-200"
                  >
                    <td className="px-6 py-4">{quiz.title}</td>
                    <td className="px-6 py-4">{quiz.classId?.name}</td>
                    <td className="px-6 py-4">
                      {new Date(quiz.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(quiz.endTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          quiz.status
                        )}`}
                      >
                        {quiz.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{quiz.questions?.length || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`${quiz._id}/questions`)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition duration-200 text-sm"
                        >
                          Questions
                        </button>
                        <button
                          onClick={() => navigate(`edit/${quiz._id}`)}
                          className="bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 transition duration-200 text-sm"
                        >
                          Edit
                        </button>
                        {quiz.status === "Draft" && (
                          <button
                            onClick={() => handleDelete(quiz._id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition duration-200 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => {
            quizzes.forEach((quiz) => {
              if (quiz.status !== "Completed") {
                handleStatusChange(quiz._id);
              }
            });
          }}
          className="mt-6 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
        >
          Reset Status
        </button>

        <div className="flex justify-center mt-6 gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:hover:bg-white"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizList;
