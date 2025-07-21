import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axios";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import "../styles/Auth.css";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Focus the email input on component mount for better UX
    emailRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors on a new submission
    try {
      const response = await apiClient.post("/auth/login", formData);
      const { token, user } = response.data;
      
      // Use the context's login function to update global state
      login(token, user);

      // ✅ Navigate to dashboard explicitly
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      // Set a user-friendly error message from the API response
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const response = await apiClient.post("/auth/google-login", {
        credential: credentialResponse.credential,
      });
      login(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Google Sign-In failed.");
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <h2>Login</h2>
        {error && <p className="errmsg" aria-live="assertive">{error}</p>}
        <form onSubmit={handleSubmit} className="side-form">
          <Input
            type="email"
            name="email"
            inputRef={emailRef}
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="auth-options" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", margin: "0.5rem 0" }}>
            <button
              type="button"
              onClick={toggleShowPassword}
              style={{
                background: "none",
                border: "none",
                color: "#007bff",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </button>
          </div>

          <Button type="submit">Login</Button>
        </form>
        
        <div className="google-login-container">
          <p className="or-divider"><span>OR</span></p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => { setError("Google Sign-In failed. Please try again."); }}
          />
        </div>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </Card>
    </div>
  );
}

export default LoginPage;
