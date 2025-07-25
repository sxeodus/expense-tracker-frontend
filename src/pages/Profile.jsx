import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/Profile.css";

function Profile() {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        setProfileUser(res.data);
        setFormData({
          firstname: res.data.firstname,
          lastname: res.data.lastname,
          username: res.data.username,
        });
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setError("Could not load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await apiClient.put("/auth/me", formData);
      setProfileUser(res.data); // Update local state
      updateUser(res.data); // Update global context state
      setIsEditing(false); // Exit edit mode
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(err.response?.data?.msg || "Failed to update profile.");
    }
  };

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profileUser) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>Could not load user data. Please try logging in again.</div>;
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
        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="profile-edit-form">
            <div className="form-group">
              <label htmlFor="firstname">First Name</label>
              <input type="text" id="firstname" name="firstname" value={formData.firstname} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastname">Last Name</label>
              <input type="text" id="lastname" name="lastname" value={formData.lastname} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleFormChange} required />
            </div>
            <div className="form-actions">
              <Button type="submit" className="save-button">Save Changes</Button>
              <Button type="button" onClick={() => setIsEditing(false)} className="cancel-button">Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <p><strong>First Name:</strong> {profileUser.firstname}</p>
            <p><strong>Last Name:</strong> {profileUser.lastname}</p>
            <p><strong>Username:</strong> {profileUser.username}</p>
            <p><strong>Email:</strong> {profileUser.email}</p>
            <p><strong>Monthly Budget:</strong> ${parseFloat(profileUser.budget || 0).toFixed(2)}</p>
            <Button onClick={() => setIsEditing(true)} className="edit-profile-button">
              Edit Profile
            </Button>
          </div>
        )}
        <div className="profile-actions">
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          {!isEditing && (
            <>
              <h3>Danger Zone</h3>
              <p>Deleting your account is a permanent action. All your data, including transactions, will be removed.</p>
              <Button onClick={handleDeleteAccount} className="delete-button" disabled={!!message}>
                Delete My Account
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Profile;
