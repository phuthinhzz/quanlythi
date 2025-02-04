import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    stats: {
      totalClasses: 0,
      totalQuizzes: 0,
      totalUsers: 0,
      totalQuestions: 0,
    },
    activeQuizzes: [],
    activeStudents: [],
    recentViolations: [],
  });

  useEffect(() => {
    fetchDashboardData();
    // Refresh active sessions every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://localhost:8000/v1/admin/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const statsData = await response.json();

      setData((prevData) => ({
        ...prevData,
        stats: {
          totalClasses: statsData.classes || 0,
          totalQuizzes: statsData.quizzes || 0,
          totalUsers: statsData.users || 0,
          totalQuestions: statsData.questions || 0,
        },
      }));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };
  const handleLogout = () => {
    // Clear access token from local storage
    localStorage.removeItem("accessToken");
    // Navigate to login page
    navigate("/login");
  };
  if (loading) {
    return <div className="text-center py-4">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded m-4">{error}</div>
    );
  }

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded m-4">{error}</div>
      ) : (
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-xl rounded-lg p-6 hover:shadow-2xl transition duration-200">
              <h3 className="text-lg font-semibold text-gray-700">
                Total Classes
              </h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {data.stats.totalClasses}
              </p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Classes Created
              </div>
            </div>
            <div className="bg-white shadow-xl rounded-lg p-6 hover:shadow-2xl transition duration-200">
              <h3 className="text-lg font-semibold text-gray-700">
                Total Quizzes
              </h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {data.stats.totalQuizzes}
              </p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Active Quizzes
              </div>
            </div>
            <div className="bg-white shadow-xl rounded-lg p-6 hover:shadow-2xl transition duration-200">
              <h3 className="text-lg font-semibold text-gray-700">
                Total Users
              </h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {data.stats.totalUsers}
              </p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Registered Users
              </div>
            </div>
            <div className="bg-white shadow-xl rounded-lg p-6 hover:shadow-2xl transition duration-200">
              <h3 className="text-lg font-semibold text-gray-700">
                Total Questions
              </h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {data.stats.totalQuestions}
              </p>
              <div className="mt-2 flex items-center text-gray-500">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Questions Created
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <button
                onClick={() => navigate("/admin/classes")}
                className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:translate-y-[-2px] transition duration-200 font-medium flex flex-col items-center gap-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Class Management
              </button>
              <button
                onClick={() => navigate("/admin/quizzes")}
                className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:translate-y-[-2px] transition duration-200 font-medium flex flex-col items-center gap-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Quiz Management
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg hover:translate-y-[-2px] transition duration-200 font-medium flex flex-col items-center gap-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                User Management
              </button>
              <button
                onClick={() => navigate("/admin/questions")}
                className="p-6 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg shadow-lg hover:translate-y-[-2px] transition duration-200 font-medium flex flex-col items-center gap-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Question Management
              </button>
            </div>
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate("/admin/monitoring")}
                className="p-6 w-1/4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg shadow-lg hover:translate-y-[-2px] transition duration-200 font-medium flex items-center justify-center gap-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Monitoring Management
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
