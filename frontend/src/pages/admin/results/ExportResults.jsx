import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ExportResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [format, setFormat] = useState("excel");
  const [includeOptions, setIncludeOptions] = useState({
    answers: true,
    violations: true,
    timeSpent: true,
  });

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const response = await fetch(`/v1/admin/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      setError("Failed to fetch quiz details");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        format,
        includeAnswers: includeOptions.answers,
        includeViolations: includeOptions.violations,
        includeTimeSpent: includeOptions.timeSpent,
      });

      const response = await fetch(
        `/v1/admin/results/quiz/${quizId}/export?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Export failed");

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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading quiz details...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-4">Quiz not found</div>;
  }

  return (
    <div className="container mx-4 my-4">
      <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Export Results</h1>
          <button
            onClick={() => navigate("/admin/results")}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        <div className="mb-6">
          <h2 className="font-bold mb-2">Quiz Details</h2>
          <div className="p-4 bg-gray-50 rounded">
            <p>
              <strong>Quiz Title:</strong> {quiz.title}
            </p>
            <p>
              <strong>Class:</strong> {quiz.classId?.name}
            </p>
            <p>
              <strong>Total Students:</strong> {quiz.totalStudents || 0}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded mb-4">{error}</div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block font-medium mb-2">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="excel">Excel (.xlsx)</option>
            </select>
          </div>

          <div>
            <h3 className="font-medium mb-2">Include in Export</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.answers}
                  onChange={(e) =>
                    setIncludeOptions((prev) => ({
                      ...prev,
                      answers: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                Student Answers
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.violations}
                  onChange={(e) =>
                    setIncludeOptions((prev) => ({
                      ...prev,
                      violations: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                Monitoring Violations
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.timeSpent}
                  onChange={(e) =>
                    setIncludeOptions((prev) => ({
                      ...prev,
                      timeSpent: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                Time Spent Details
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Preparing Export..." : "Export Results"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportResults;
