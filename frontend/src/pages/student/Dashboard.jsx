import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserData = async () => {
      if (localStorage.getItem("accessToken")) {
        await saveUserIdFromToken(localStorage.getItem("accessToken"));
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    // Only set username when user data is available
    if (user && user.name) {
      localStorage.setItem("username", user.name);
    }
  }, [user]);

  const saveUserIdFromToken = async (accessToken) => {
    try {
      const decodedToken = jwtDecode(accessToken);
      const userId = decodedToken.id;

      const response = await fetch(
        `http://localhost:8000/v1/students/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const userData = await response.json();
      localStorage.setItem("userId", userId);
      setUser(userData);

      console.log("User data fetched:", userData);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleLogout = () => {
    // Clear access token from local storage
    localStorage.removeItem("accessToken");
    // Navigate to login page
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <nav className="flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/student/quizzes"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Quizzes
              </Link>
              <div
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-8">
          <div className="px-6 py-5 sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name || "Student"}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Access your quizzes and manage your academic progress through
                your personalized dashboard.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/student/quizzes"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Active Quizzes
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/student/quizzes"
            className="group relative bg-white overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <svg
                    className="w-8 h-8 text-blue-600 group-hover:text-white"
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
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  Quizzes
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View and take your active quizzes
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/student/profile"
            className="group relative bg-white overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-600 transition-colors">
                  <svg
                    className="w-8 h-8 text-green-600 group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600">
                  Profile
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View and update your profile
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/settings"
            className="group relative bg-white overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-600 transition-colors">
                  <svg
                    className="w-8 h-8 text-yellow-600 group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-yellow-600">
                  Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your preferences
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
