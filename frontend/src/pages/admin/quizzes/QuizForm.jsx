import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const QuizForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    classId: "",
    duration: 60,
    startTime: "",
    endTime: "",
    settings: {
      requireCamera: true,
      requireFullscreen: true,
      notallowTabChange: false,
      shuffleQuestions: false,
    },
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClasses();
    if (isEditing) {
      fetchQuizData();
    }
  }, [id]);

  const fetchClasses = async () => {
    try {
      const response = await fetch("http://localhost:8000/v1/admin/classes", {
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

  const fetchQuizData = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/quizzes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      setFormData({
        ...data,
        startTime: new Date(data.startTime).toISOString().slice(0, 16),
        endTime: new Date(data.endTime).toISOString().slice(0, 16),
      });
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to fetch quiz data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `http://localhost:8000/v1/admin/quizzes/${id}`
        : "http://localhost:8000/v1/admin/quizzes";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save quiz");
      }
      if (!isEditing) {
        await fetch(
          `http://localhost:8000/v1/admin/students/create-student-quiz`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
              classId: formData.classId, // Truyền classId dưới dạng object
            }),
          }
        );
      }
      navigate("/admin/quizzes");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto my-8 max-w-3xl px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">
          {isEditing ? "Edit Quiz" : "Create New Quiz"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Class
            </label>
            <select
              value={formData.classId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, classId: e.target.value }))
              }
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            >
              <option value="">Select a class</option>
              {classes?.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  duration: parseInt(e.target.value),
                }))
              }
              required
              min="1"
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endTime: e.target.value }))
              }
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            />
          </div>

          <div className="space-y-4 p-6 bg-gray-50 rounded-lg mt-8">
            <h3 className="font-bold text-xl mb-4 text-gray-800">Settings</h3>

            <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition duration-200">
              <input
                type="checkbox"
                checked={formData.settings.requireCamera}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      requireCamera: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Require Camera</span>
            </label>

            <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition duration-200">
              <input
                type="checkbox"
                checked={formData.settings.requireFullscreen}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      requireFullscreen: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Require Fullscreen</span>
            </label>

            <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition duration-200">
              <input
                type="checkbox"
                checked={formData.settings.notallowTabChange}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      notallowTabChange: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Not Allow Tab Change</span>
            </label>

            <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition duration-200">
              <input
                type="checkbox"
                checked={formData.settings.shuffleQuestions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      shuffleQuestions: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Shuffle Questions</span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate("/admin/quizzes")}
              className="px-6 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 font-medium disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Quiz"
                : "Create Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizForm;
