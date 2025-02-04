import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetchClasses();
  }, [currentPage, search, sortColumn, sortDirection]);

  const fetchClasses = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: currentPage,
        search: search || "",
        sortColumn: sortColumn || "",
        sortDirection: sortDirection || "",
      }).toString();

      const response = await fetch(
        `http://localhost:8000/v1/admin/classes?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await response.json();
      setClasses(data.classes || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await fetch(`http://localhost:8000/v1/admin/classes/${classId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const getStatusBadge = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    let status;
    let colorClass;

    if (now < start) {
      status = "Upcoming";
      colorClass = "bg-yellow-100 text-yellow-800";
    } else if (now > end) {
      status = "Completed";
      colorClass = "bg-gray-100 text-gray-800";
    } else {
      status = "Active";
      colorClass = "bg-green-100 text-green-800";
    }

    return (
      <span className={`px-2 py-1 rounded text-sm ${colorClass}`}>
        {status}
      </span>
    );
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
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
          <h1 className="text-3xl font-bold text-gray-800">Class Management</h1>
          <button
            onClick={() => navigate("create")}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 font-medium flex items-center gap-2"
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
            Create Class
          </button>
        </div>

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search classes..."
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition duration-200"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Class Name{renderSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition duration-200"
                      onClick={() => handleSort("startTime")}
                    >
                      <div className="flex items-center gap-2">
                        Start Date{renderSortIcon("startTime")}
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition duration-200"
                      onClick={() => handleSort("endTime")}
                    >
                      <div className="flex items-center gap-2">
                        End Date{renderSortIcon("endTime")}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition duration-200"
                      onClick={() => handleSort("students.length")}
                    >
                      <div className="flex items-center gap-2">
                        Students{renderSortIcon("students.length")}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classes?.map((cls) => (
                    <tr
                      key={cls._id}
                      className="hover:bg-gray-50 transition duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {cls.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(cls.startTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(cls.endTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(cls.startTime, cls.endTime)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {cls.students?.length || 0} students
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => navigate(`import/${cls._id}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm"
                        >
                          Import Students
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/classes/students/${cls._id}`)
                          }
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm"
                        >
                          Students
                        </button>
                        <button
                          onClick={() => navigate(`edit/${cls._id}`)}
                          className="px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition duration-200 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cls._id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8 gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassList;
