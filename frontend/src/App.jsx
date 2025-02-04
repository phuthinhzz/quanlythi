import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Auth pages
import Login from "./pages/auth/Login";

// Admin pages
import AdminDashboard from "./pages/admin/DashBoard";
import Users from "./pages/admin/users/UserList";
// import Users from "./pages/admin/users/Test";
import UserForm from "./pages/admin/users/UserForm";
import ImportUsers from "./pages/admin/users/ImportUsers";
import Classes from "./pages/admin/classes/ClassList";
import ClassForm from "./pages/admin/classes/ClassForm";
import ImportStudents from "./pages/admin/classes/ImportStudents";
import StudentList from "./pages/admin/classes/StudentsList";
import Questions from "./pages/admin/questions/QuestionList";
import QuestionForm from "./pages/admin/questions/QuestionForm";
import ImportQuestions from "./pages/admin/questions/ImportQuestions";
import Quizzes from "./pages/admin/quizzes/QuizList";
import QuizForm from "./pages/admin/quizzes/QuizForm";
import QuestionSelector from "./pages/admin/quizzes/QuestionSelector";
import QuizSettings from "./pages/admin/quizzes/QuizSettings";
import LiveMonitoring from "./pages/admin/monitoring/LiveMonitoring";
import StudentCamera from "./pages/admin/monitoring/StudentCamera";
import ViolationsList from "./pages/admin/monitoring/ViolationsList";
import ResultsList from "./pages/admin/results/ResultsList";
import ResultDetails from "./pages/admin/results/ResultDetails";
import ExportResults from "./pages/admin/results/ExportResults";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentClasses from "./pages/student/classes/ClassList";
import ClassDetails from "./pages/student/classes/ClassDetails";
import StudentQuizzes from "./pages/student/quizzes/QuizList";
import QuizDetails from "./pages/student/quizzes/QuizDetails";
import QuizResults from "./pages/student/quizzes/QuizResults";
import ExamInterface from "./pages/student/exam/ExamInterface";
import MainPage from "./pages/MainPage";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/users/create" element={<UserForm />} />
        <Route path="/admin/users/edit/:id" element={<UserForm />} />
        <Route path="/admin/users/import" element={<ImportUsers />} />
        <Route path="/admin/classes" element={<Classes />} />
        <Route path="/admin/classes/create" element={<ClassForm />} />
        <Route path="/admin/classes/edit/:id" element={<ClassForm />} />
        <Route path="/admin/classes/import/:id" element={<ImportStudents />} />
        <Route path="/admin/classes/students/:id" element={<StudentList />} />
        <Route path="/admin/questions" element={<Questions />} />
        <Route path="/admin/questions/create" element={<QuestionForm />} />
        <Route path="/admin/questions/edit/:id" element={<QuestionForm />} />
        <Route path="/admin/questions/import" element={<ImportQuestions />} />
        <Route path="/admin/quizzes" element={<Quizzes />} />
        <Route path="/admin/quizzes/create" element={<QuizForm />} />
        <Route path="/admin/quizzes/edit/:id" element={<QuizForm />} />
        <Route
          path="/admin/quizzes/:id/questions"
          element={<QuestionSelector />}
        />
        <Route path="/admin/quizzes/:id/settings" element={<QuizSettings />} />
        <Route path="/admin/monitoring" element={<LiveMonitoring />} />
        <Route
          path="/admin/monitoring/student/:id"
          element={<StudentCamera />}
        />
        <Route
          path="/admin/monitoring/violations"
          element={<ViolationsList />}
        />
        <Route path="/admin/results" element={<ResultsList />} />
        <Route path="/admin/results/:id" element={<ResultDetails />} />
        <Route
          path="/admin/results/export/:quizId"
          element={<ExportResults />}
        />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/classes" element={<StudentClasses />} />
        <Route path="/student/classes/details/:id" element={<ClassDetails />} />
        <Route path="/student/quizzes" element={<StudentQuizzes />} />
        <Route path="/student/quiz/:id" element={<QuizDetails />} />
        <Route path="/student/quiz/:id/result" element={<QuizResults />} />
        <Route path="/student/exam/:quizId" element={<ExamInterface />} />
      </Routes>
    </Router>
  );
};

export default App;
