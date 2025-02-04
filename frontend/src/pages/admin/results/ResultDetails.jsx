import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ResultDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResultDetails();
  }, [id]);

  const fetchResultDetails = async () => {
    try {
      const response = await fetch(`/v1/admin/results/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch result details");

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setError("Failed to load result details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading result details...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded m-4">{error}</div>
    );
  }

  if (!result) {
    return <div className="text-center py-4">Result not found</div>;
  }

  return (
    <div className="container mx-4 my-4">
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{result.userId?.name}</h1>
            <p className="text-gray-600">MSSV: {result.userId?.mssv}</p>
          </div>
          <button
            onClick={() => navigate("/admin/results")}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Back to Results
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <h2 className="font-bold mb-2">Quiz Information</h2>
              <div className="space-y-1">
                <p>
                  <strong>Quiz:</strong> {result.quizId?.title}
                </p>
                <p>
                  <strong>Class:</strong> {result.quizId?.classId?.name}
                </p>
                <p>
                  <strong>Duration:</strong> {result.quizId?.duration} minutes
                </p>
                <p>
                  <strong>Submitted:</strong>{" "}
                  {new Date(result.submissionDetails.endTime).toLocaleString()}
                </p>
                <p>
                  <strong>Time Spent:</strong>{" "}
                  {result.submissionDetails.timeSpent} minutes
                </p>
              </div>
            </div>

            <div className="p-4 border rounded">
              <h2 className="font-bold mb-2">Score Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Total Score</span>
                  <span className="font-bold">
                    {result.marksObtained}/{result.totalMarks}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Percentage</span>
                  <span className="font-bold">
                    {((result.marksObtained / result.totalMarks) * 100).toFixed(
                      1
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status</span>
                  <span
                    className={`px-2 py-1 rounded ${
                      result.status === "Passed"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded">
              <h2 className="font-bold mb-2">Monitoring Summary</h2>
              <div className="space-y-1">
                <p>
                  <strong>Camera Violations:</strong>{" "}
                  {result.violationSummary.cameraViolations}
                </p>
                <p>
                  <strong>Fullscreen Violations:</strong>{" "}
                  {result.violationSummary.fullscreenViolations}
                </p>
                <p>
                  <strong>Tab Switches:</strong>{" "}
                  {result.violationSummary.tabSwitchViolations}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded">
            <h2 className="font-bold mb-4">Answer Details</h2>
            <div className="space-y-4">
              {result?.answers?.map((answer, index) => (
                <div
                  key={index}
                  className={`p-3 rounded ${
                    answer.isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="font-medium mb-2">
                    Question {index + 1}: {answer.questionId.text}
                  </div>
                  <div className="text-sm">
                    <p>
                      <strong>Selected Answer:</strong> {answer.selectedOption}
                    </p>
                    <p>
                      <strong>Points:</strong> {answer.points}/
                      {answer.questionId.points}
                    </p>
                    <p>
                      <strong>Time Spent:</strong> {answer.timeSpent} seconds
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDetails;
