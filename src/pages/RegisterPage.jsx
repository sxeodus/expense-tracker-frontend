import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import apiClient from "../api/axios";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/Auth.css";

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

function RegisterPage() {
  const userRef = useRef();

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    matchPwd: "",
    budget: "",
  });

  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setValidName(USER_REGEX.test(formData.username));
  }, [formData.username]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(formData.password));
    setValidMatch(formData.password === formData.matchPwd);
  }, [formData.password, formData.matchPwd]);

  useEffect(() => {
    setErrMsg("");
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validName || !validPwd || !validMatch) {
      setErrMsg("Invalid Entry");
      return;
    }

    // Destructure to avoid sending matchPwd to the backend
    const { matchPwd, ...payload } = formData;

    try {
      await apiClient.post("/auth/register", payload);

      setSuccess(true);
      // Clear form fields
      setFormData({
        firstname: "", lastname: "", username: "", email: "",
        password: "", matchPwd: "", budget: "",
      });
      // Navigate to login after a short delay so user can see the message
      setTimeout(() => navigate("/login"), 3000);

    } catch (err) {
      console.error("Registration error:", err);
      if (!err?.response) {
        setErrMsg("No Server Response");
      } else if (err.response?.status === 400) {
        setErrMsg(err.response.data.message || "User with this email already exists.");
      } else {
        setErrMsg("Registration Failed");
      }
    }
  };

  return (
    <div className="auth-container">
      <Card>
        {success ? (
          <section>
            <h2>Success!</h2>
            <p>Your account has been created. Redirecting to the login page...</p>
            <p>
              <Link to="/login">Click here to login now</Link>
            </p>
          </section>
        ) : (
          <>
            <h2>Register</h2>
            <p className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">
              {errMsg}
            </p>
            <form onSubmit={handleSubmit} className="side-form">
              <div className="form-row">
                <label htmlFor="firstname">First Name</label>
                <input name="firstname" id="firstname" placeholder="First Name" value={formData.firstname} onChange={handleChange} required autoComplete="given-name" />
              </div>
              <div className="form-row">
                <label htmlFor="lastname">Last Name</label>
                <input name="lastname" id="lastname" placeholder="Last Name" value={formData.lastname} onChange={handleChange} required autoComplete="family-name" />
              </div>
              <div className="form-row">
                <label htmlFor="username">
                  Username
                  <FontAwesomeIcon icon={faCheck} className={validName ? "valid" : "hide"} />
                  <FontAwesomeIcon icon={faTimes} className={validName || !formData.username ? "hide" : "invalid"} />
                </label>
                <input type="text" placeholder="Username" id="username" ref={userRef} name="username" value={formData.username} onChange={handleChange} required aria-invalid={validName ? "false" : "true"} aria-describedby="uidnote" onFocus={() => setUserFocus(true)} onBlur={() => setUserFocus(false)} autoComplete="username" />
              </div>
              <p id="uidnote" className={userFocus && formData.username && !validName ? "instructions" : "offscreen"}>
                <FontAwesomeIcon icon={faInfoCircle} /> 4 to 24 characters. Must begin with a letter.
              </p>
              <div className="form-row">
                <label htmlFor="email">Email</label>
                <input type="email" name="email" id="email" placeholder="Email" value={formData.email} onChange={handleChange} required autoComplete="email" />
              </div>
              <div className="form-row">
                <label htmlFor="password">
                  Password
                  <FontAwesomeIcon icon={faCheck} className={validPwd ? "valid" : "hide"} />
                  <FontAwesomeIcon icon={faTimes} className={validPwd || !formData.password ? "hide" : "invalid"} />
                </label>
                <input type="password" placeholder="Password" name="password" id="password" value={formData.password} onChange={handleChange} required aria-invalid={validPwd ? "false" : "true"} aria-describedby="pwdnote" onFocus={() => setPwdFocus(true)} onBlur={() => setPwdFocus(false)} autoComplete="new-password" />
              </div>
              <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                <FontAwesomeIcon icon={faInfoCircle} /> 8–24 characters. Must include uppercase/lowercase, number, and special character (!@#$%).
              </p>
              <div className="form-row">
                <label htmlFor="matchPwd">
                  Confirm Password
                  <FontAwesomeIcon icon={faCheck} className={validMatch && formData.matchPwd ? "valid" : "hide"} />
                  <FontAwesomeIcon icon={faTimes} className={validMatch || !formData.matchPwd ? "hide" : "invalid"} />
                </label>
                <input type="password" name="matchPwd" id="matchPwd" value={formData.matchPwd} onChange={handleChange} required aria-invalid={validMatch ? "false" : "true"} aria-describedby="confirmnote" onFocus={() => setMatchFocus(true)} onBlur={() => setMatchFocus(false)} autoComplete="new-password" />
              </div>
              <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                <FontAwesomeIcon icon={faInfoCircle} /> Must match the password field.
              </p>
              <div className="form-row">
                <label htmlFor="budget">Monthly Budget</label>
                <input name="budget" id="budget" type="number" placeholder="Your Monthly Budget" value={formData.budget} onChange={handleChange} required min="0" autoComplete="off" />
              </div>
              <Button type="submit" disabled={!validName || !validPwd || !validMatch}>Register</Button>
            </form>
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

export default RegisterPage;
