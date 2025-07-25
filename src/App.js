import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ExpenseTracker from "./pages/ExpenseTracker";
import BudgetOverview from "./pages/BudgetOverview";
import Profile from "./pages/Profile";
import PrivateRoute from "./components/PrivateRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { useAuth } from "./context/AuthContext";

function App() {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute>
              <ExpenseTracker />
            </PrivateRoute>
          )}
        />
        <Route
          path="/budget-overview"
          element={(
            <PrivateRoute>
              <BudgetOverview />
            </PrivateRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          )}
        />
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>    
  );
}

export default App;
