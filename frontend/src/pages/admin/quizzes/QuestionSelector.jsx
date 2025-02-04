import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

const QuestionSelector = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [quiz, setQuiz] = useState({});
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [questionsApi, setQuestionsApi] = useState([]);
  const [questionsFilter, setQuestionsFilter] = useState([]);
  const [dataChoose, setDataChoose] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    difficulty: "",
    category: "",
  });

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      await fetchAvailableQuestions();
      await fetchQuestionsApi();
      await fetchQuiz();
    };
    loadData();
  }, [id]);

  // Cập nhật `questionsFilter` khi `questionsApi` hoặc `quiz` thay đổi
  useEffect(() => {
    if (questionsApi.length > 0 && Array.isArray(quiz.questions)) {
      setQuestionsFilter(
        questionsApi.filter(
          (question) =>
            !quiz.questions.includes(question._id) &&
            quiz.classId === question.classId._id
        )
      );
    }
  }, [questionsApi, quiz]);

  // Lấy thông tin quiz
  const fetchQuiz = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes/get-all/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      setQuiz(data.quiz || {});
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to load quiz data");
    }
  };

  // Lấy danh sách câu hỏi từ API
  const fetchAvailableQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/v1/admin/questions", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      setAvailableQuestions(data.questions || []);
    } catch (error) {
      console.error("Error fetching available questions:", error);
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsApi = async () => {
    try {
      const response = await fetch("http://localhost:8000/v1/admin/questions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const data = await response.json();
      setQuestionsApi(data.questions || []);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setError("Failed to fetch questions");
    }
  };

  // Chọn câu hỏi
  const handleChooseQuestion = (id) => {
    const data = questionsApi.find((x) => x._id === id);
    if (data) {
      setDataChoose((prev) => [...prev, data]);
      setQuestionsApi(questionsApi.filter((x) => x._id !== id));
    } else {
      console.warn(`No question found with id: ${id}`);
    }
  };

  // Thêm câu hỏi vào quiz
  const handleAdd = async () => {
    try {
      const questionIds = dataChoose?.map((question) => question._id);
      const payload = { quizId: id, questionIds };

      const response = await fetch(
        "http://localhost:8000/v1/admin/quizzes/add-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Error adding questions:", result.message);
        alert(`Error: ${result.message}`);
        return;
      }

      console.log("Questions added successfully:", result);
      alert("Questions added successfully!");
    } catch (error) {
      console.error("Error adding questions:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Xử lý file Excel
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (
      selectedFile?.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setError("Please select a valid Excel file (.xlsx)");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const fileData = new Uint8Array(event.target.result);
      const workbook = XLSX.read(fileData, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const texts = jsonData?.map((row) => row["text"]).filter((text) => text);

      if (texts.length === 0) {
        setError("No valid texts found in the Excel file.");
        return;
      }

      setDataChoose(
        questionsApi.filter((item) =>
          texts.some(
            (text) =>
              text.trim().toLowerCase() === item.text.trim().toLowerCase()
          )
        )
      );

      setQuestionsApi(
        questionsApi.filter(
          (item) =>
            !texts.some(
              (text) =>
                text.trim().toLowerCase() === item.text.trim().toLowerCase()
            )
        )
      );
    };

    reader.onerror = (error) => {
      setError("Failed to read the file. Please try again.");
      console.error("File reading error:", error);
    };

    reader.readAsArrayBuffer(selectedFile);
  };
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin Dashboard */}
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

      <div className="container mx-auto py-8 px-4">
        {/* Thêm nút Back */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/quizzes")}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Quiz Management
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition duration-200">
            <div className="flex flex-col items-center justify-center">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-4">
                Template should include: Question Text, Options, Category,
                Difficulty, Points
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <input
              type="text"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
            <div className="flex gap-4">
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    difficulty: e.target.value,
                  }))
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="">All Categories</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              Available Questions
            </h2>
            <div className="space-y-4">
              {questionsFilter?.map((question) => (
                <div
                  key={question._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition duration-200"
                >
                  <p className="font-medium text-gray-800 mb-3">
                    {question.text}
                  </p>
                  <button
                    onClick={() => handleChooseQuestion(question._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium"
                  >
                    Choose Question
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              Selected Questions
            </h2>
            <div className="space-y-4">
              {dataChoose?.map((question) => (
                <div
                  key={question._id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <p className="font-medium text-gray-800">{question.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleAdd}
              className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium"
            >
              Add Selected Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelector;
