import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/Profile.css";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    setError("");
    setMessage("");
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        await apiClient.delete("/auth/delete");
        setMessage("Account deleted successfully. You will be logged out.");
        setTimeout(() => {
          logout();
          navigate("/login", { replace: true });
        }, 3000);
      } catch (err) {
        console.error("Failed to delete account", err);
        setError(err.response?.data?.message || "Failed to delete account.");
      }
    }
  };

  if (!user) {
    // This should ideally not be shown as PrivateRoute handles it, but it's good practice.
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h2>User Profile</h2>
        <div className="profile-nav">
          <Link to="/dashboard">← Dashboard</Link>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>
      <Card>
        <div className="profile-details">
          <p><strong>First Name:</strong> {user.firstname}</p>
          <p><strong>Last Name:</strong> {user.lastname}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Monthly Budget:</strong> ${parseFloat(user.budget).toFixed(2)}</p>
        </div>
        <div className="profile-actions">
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          <h3>Danger Zone</h3>
          <p>Deleting your account is a permanent action. All your data, including transactions, will be removed.</p>
          <Button onClick={handleDeleteAccount} className="delete-button" disabled={!!message}>
            Delete My Account
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Profile;

