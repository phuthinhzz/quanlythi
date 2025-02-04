import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ResultsList = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    quizId: "",
    classId: "",
    status: "",
  });
  const [classes, setClasses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [currentPage, filters]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/v1/admin/classes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      setClasses(data.classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/v1/admin/quizzes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      setQuizzes(data.quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        ...filters,
      });

      const response = await fetch(`/v1/admin/results?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      setResults(data.results);
      setTotalPages(data.totalPages);
    } catch (error) {
      setError("Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (quizId) => {
    try {
      const response = await fetch(
        `/v1/admin/results/quiz/${quizId}/export?format=excel`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Export failed");

      // Handle the downloaded file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-results-${quizId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to export results");
    }
  };

  return (
    <div className="container mx-4 my-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Results</h1>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={filters.classId}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, classId: e.target.value }))
          }
          className="border p-2 rounded"
        >
          <option value="">All Classes</option>
          {classes?.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
            </option>
          ))}
        </select>

        <select
          value={filters.quizId}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, quizId: e.target.value }))
          }
          className="border p-2 rounded"
        >
          <option value="">All Quizzes</option>
          {quizzes?.map((quiz) => (
            <option key={quiz._id} value={quiz._id}>
              {quiz.title}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading results...</div>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Student</th>
              <th className="border p-2 text-left">MSSV</th>
              <th className="border p-2 text-left">Quiz</th>
              <th className="border p-2 text-left">Score</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Submission Time</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results?.map((result) => (
              <tr key={result._id} className="hover:bg-gray-50">
                <td className="border p-2">{result.userId?.name}</td>
                <td className="border p-2">{result.userId?.mssv}</td>
                <td className="border p-2">{result.quizId?.title}</td>
                <td className="border p-2">
                  {result.marksObtained}/{result.totalMarks}
                </td>
                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      result.status === "Passed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </td>
                <td className="border p-2">
                  {new Date(result.submissionDetails.endTime).toLocaleString()}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => navigate(`/admin/results/${result._id}`)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No results found matching your filters
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {filters.quizId && (
          <button
            onClick={() => handleExport(filters.quizId)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Results
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsList;
