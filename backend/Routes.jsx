import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/admin/Dashboard";
import UserList from "./pages/admin/users/UserList";
import ClassList from "./pages/admin/classes/ClassList";
import QuestionList from "./pages/admin/questions/QuestionList";
import QuizList from "./pages/admin/quizzes/QuizList";
import Monitoring from "./pages/admin/monitoring/LiveMonitoring";
import ResultsList from "./pages/admin/results/ResultsList";
import StudentDashboard from "./pages/student/Dashboard";
import StudentClassList from "./pages/student/classes/ClassList";
import StudentQuizList from "./pages/student/quizzes/QuizList";
import Exam from "./pages/student/Exam";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/admin">
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserList />} />
        <Route path="classes" element={<ClassList />} />
        <Route path="questions" element={<QuestionList />} />
        <Route path="quizzes" element={<QuizList />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="results" element={<ResultsList />} />
      </Route>
      <Route path="/student">
        <Route index element={<StudentDashboard />} />
        <Route path="classes" element={<StudentClassList />} />
        <Route path="quizzes" element={<StudentQuizList />} />
        <Route path="exam/:quizId" element={<Exam />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
