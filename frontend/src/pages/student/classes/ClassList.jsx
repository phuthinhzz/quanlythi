import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("active"); // active, upcoming, completed

  useEffect(() => {
    fetchClasses();
  }, [filter]);

  const fetchClasses = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/v1/admin/classes?status=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await response.json();
      setClasses(data.classes);
    } catch (error) {
      setError("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    let color;
    let text;

    if (now < start) {
      color = "bg-yellow-100 text-yellow-800";
      text = "Upcoming";
    } else if (now > end) {
      color = "bg-gray-100 text-gray-800";
      text = "Completed";
    } else {
      color = "bg-green-100 text-green-800";
      text = "Active";
    }

    return <span className={`px-2 py-1 rounded text-sm ${color}`}>{text}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your enrolled classes
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-8 inline-flex">
          <button
            onClick={() => setFilter("active")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              filter === "active"
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              filter === "upcoming"
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              filter === "completed"
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Error Message */}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {cls.name}
                      </h2>
                      <div className="flex items-center text-sm text-gray-500">
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
                        {new Date(cls.startTime).toLocaleDateString()} -{" "}
                        {new Date(cls.endTime).toLocaleDateString()}
                      </div>
                    </div>
                    {getStatusBadge(cls.startTime, cls.endTime)}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900">
                          {cls.quizzes?.length || 0}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-gray-500">
                          Quizzes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-gray-900">
                          {cls.students?.length || 0}
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-gray-500">
                          Students
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`details/${cls._id}`)}
                      className="mt-6 w-full inline-flex justify-center items-center px-4 py-2.5 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                      <svg
                        className="ml-2 -mr-1 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && classes.length === 0 && (
              <div className="col-span-full text-center py-12">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No {filter} classes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Check back later for new classes.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassList;
