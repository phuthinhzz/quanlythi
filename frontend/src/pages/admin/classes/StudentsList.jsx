import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const StudentsList = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [studentQuiz, setStudentQuiz] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reuilts, setResuilts] = useState([]);
  const [users, setUsers] = useState([]);
  // console.log(id);
  useEffect(() => {
    fetchClassData();
    fetchStudents();
    fetchQuizses();
    fetchReuilt();
    fetchUser();
  }, [id]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/classes/studentlist/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      setClassData(data.classData);
      setStudents(data.students);
    } catch (error) {
      console.error("Error fetching class:", error);
      setError("Failed to fetch class data");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/v1/admin/students/student-quiz`,
        {
          method: "GET", // Đặt phương thức đúng vị trí
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudentQuiz(data); // Kiểm tra định dạng dữ liệu
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes/allquiz/all`,
        {
          method: "GET", // Đặt phương thức đúng vị trí
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      // console.log(data);
      setQuiz(data); // Kiểm tra định dạng dữ liệu
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/v1/admin/users/all-user/all`,
        {
          method: "GET", // Đặt phương thức đúng vị trí
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      // console.log(data);
      setUsers(data); // Kiểm tra định dạng dữ liệu
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };
  const fetchReuilt = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/v1/students/resuilt`,
        {
          method: "GET", // Đặt phương thức đúng vị trí
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      // console.log(data);
      setResuilts(data); // Kiểm tra định dạng dữ liệu
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveStudent = async (studentId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this student from the class?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/classes/remove-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            id,
            studentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove student");
      }

      // Refresh class data after successful removal
      fetchClassData();
    } catch (error) {
      console.error("Error removing student:", error);
      setError("Failed to remove student");
    }
  };

  const filteredStudents = students.filter((student) => {
    const lowercaseSearch = search.toLowerCase();
    const nameMatch = student.name.toLowerCase().includes(lowercaseSearch);
    const mssvMatch = student.mssv.toLowerCase().includes(lowercaseSearch);
    const emailMatch = student.email.toLowerCase().includes(lowercaseSearch);

    const quizMatch = studentQuiz
      .filter((x) => x.userId === student._id)
      .some((filteredItem) =>
        filteredItem.quizzes.some((quizItem) => {
          const matchedQuiz = quiz.find((x) => x._id === quizItem.quizId);
          return (
            matchedQuiz &&
            matchedQuiz.title.toLowerCase().includes(lowercaseSearch)
          );
        })
      );

    return nameMatch || mssvMatch || emailMatch || quizMatch;
  });
  const handleLogout = () => {
    // Clear access token from local storage
    localStorage.removeItem("accessToken");
    // Navigate to login page
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Class Students
                </h1>
                {classData && (
                  <p className="mt-2 text-lg text-gray-600">{`${classData.name} - ${id}`}</p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/admin/classes/import/${id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Import Students
                </button>
                <button
                  onClick={() => navigate("/admin/classes")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium"
                >
                  Back to Classes
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students by name, MSSV, email or quiz..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-8">
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
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-8">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MSSV
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Quiz
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statistics
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resuilt
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents?.map((student) => (
                        <tr
                          key={student._id}
                          className="hover:bg-gray-50 transition duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.mssv}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {student.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {studentQuiz
                              .filter((x) => x.userId === student._id)
                              .map((filteredItem) =>
                                filteredItem.quizzes?.map((quizItem) => {
                                  const matchedQuiz = quiz.find(
                                    (x) =>
                                      x._id === quizItem.quizId &&
                                      id === x.classId
                                  );
                                  if (!matchedQuiz) return null;
                                  return (
                                    <div
                                      key={quizItem.quizId}
                                      className="text-sm text-gray-900"
                                    >
                                      {matchedQuiz
                                        ? `-${matchedQuiz.title}`
                                        : "Quiz Not Found"}
                                    </div>
                                  );
                                })
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {studentQuiz
                              .filter((x) => x.userId === student._id)
                              .map((filteredItem) =>
                                filteredItem.quizzes?.map((quizItem) => {
                                  {
                                    /* console.log(classData); */
                                  }

                                  // Kiểm tra nếu classData.quizzes tồn tại và không rỗng
                                  if (classData?.quizzes?.length > 0) {
                                    const isMatchingQuiz =
                                      classData.quizzes.find(
                                        (x) =>
                                          x === quizItem.quizId &&
                                          classData._id === id
                                      );
                                    if (isMatchingQuiz) {
                                      return (
                                        <div
                                          className="text-sm text-gray-900"
                                          key={quizItem.quizId}
                                        >
                                          {quizItem.status}
                                        </div>
                                      );
                                    }
                                  }

                                  return null;
                                })
                              )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {studentQuiz
                              .filter((x) => x.userId === student._id)
                              .flatMap((filteredItem) =>
                                filteredItem.quizzes?.map((quizItem) => {
                                  const isMatchingQuiz =
                                    classData?.quizzes?.find(
                                      (quiz) =>
                                        quiz === quizItem.quizId &&
                                        classData._id === id
                                    );
                                  console.log("isMatchingQuiz", isMatchingQuiz);
                                  const matchedQuiz = reuilts.find(
                                    (result) =>
                                      result.quizId === isMatchingQuiz &&
                                      result.userId === student._id
                                  );
                                  console.log("matchedQuiz", matchedQuiz);
                                  const isMatchingClass = quiz.find(
                                    (x) =>
                                      x._id === isMatchingQuiz &&
                                      x.classId === classData._id
                                  );
                                  if (!isMatchingClass) return null;
                                  if (!matchedQuiz) {
                                    return (
                                      <div
                                        key={quizItem.quizId}
                                        className="text-sm text-gray-900"
                                      >
                                        No Data
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={matchedQuiz.quizId}
                                      className="text-sm text-gray-900"
                                    >
                                      {matchedQuiz.marksObtained}
                                    </div>
                                  );
                                })
                              )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              className="text-red-600 hover:text-red-900 font-medium transition duration-200"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="mt-4 text-gray-500 text-lg">No students found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsList;
