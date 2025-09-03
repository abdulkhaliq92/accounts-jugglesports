// src/components/Auth/Login.jsx
import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, Sparkles } from "lucide-react";
import { useDispatch } from "react-redux";
import { useHistory, Link } from "react-router-dom";
import { useSnackbar } from "react-simple-snackbar";
import { signup, signin } from "../../actions/auth";
// import { createProfile } from "../../actions/profile"; // keep if/when you re-enable Google
import "./Login.css"; // <-- moved styles here (see step 2)
import Logo from "../svgIcons/Logo";

// keep the original field names so your actions continue to work as-is
const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  profilePicture: "",
  bio: "",
};

const Login = () => {
  const [formData, setFormData] = useState(initialState);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();
  const [openSnackbar] = useSnackbar();

  // redirect if already logged in (kept from original behavior)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("profile"));
    if (user) history.push("/dashboard");
  }, [history]);

  const handleShowPassword = () => setShowPassword((s) => !s);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // simple client-side check to prevent mismatched passwords
    if (isSignup && formData.password !== formData.confirmPassword) {
      openSnackbar("Passwords do not match");
      return;
    }

    setLoading(true);
    if (isSignup) {
      // pass setLoading & snackbar so the action can control UI like before
      dispatch(signup(formData, openSnackbar, setLoading));
    } else {
      dispatch(signin(formData, openSnackbar, setLoading));
    }
  };

  const switchMode = () => {
    setIsSignup((p) => !p);
    setFormData(initialState);
    setShowPassword(false);
  };

  return (
    <div className="login-container">
      <div className="background-effects">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
      </div>

      <div className="login-wrapper">
        <div className="header-section">
          {/* <div className="logo-container">
            {/* <Building2 className="logo-icon" />
          </div> */}
          <Logo className="login-logo" />
          <div className="title-section">
            <h1 className="main-title">InvoicePro</h1>
            {/* <p className="subtitle">Professional invoicing made effortless</p> */}
          </div>
        </div>

        <div className="form-card">
          <div className="form-header">
            <div className="form-icon-container">
              <Lock className="form-icon" />
              <div className="icon-overlay" />
            </div>
            <div className="form-title-section">
              <h2 className="form-title">{isSignup ? "Join InvoicePro" : "Welcome Back"}</h2>
              <p className="form-description">
                {isSignup
                  ? "Create your account and start managing invoices like a pro"
                  : "Sign in to access your dashboard and continue your work"}
              </p>
              <p></p>
            </div>
          </div>

          <div className="form-content">
            <form onSubmit={handleSubmit} className="login-form">
              {isSignup && (
                <div className="name-fields">
                  <div className="field-group">
                    <label htmlFor="firstName" className="field-label">
                      First Name
                    </label>
                    <div className="input-wrapper">
                      <User className="input-icon" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="form-input"
                        required={isSignup}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="lastName" className="field-label">
                      Last Name
                    </label>
                    <div className="input-wrapper">
                      <User className="input-icon" />
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="form-input"
                        required={isSignup}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="field-group">
                <label htmlFor="email" className="field-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input password-input"
                    required
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button type="button" onClick={handleShowPassword} className="password-toggle" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div className="field-group">
                  <label htmlFor="confirmPassword" className="field-label">
                    Confirm Password
                  </label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      required={isSignup}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              <button type="submit" className={`submit-button ${loading ? "loading" : ""}`} disabled={loading}>
                {loading ? (
                  <div className="loading-content">
                    <div className="spinner" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="button-content">
                    <span>{isSignup ? "Create Account" : "Sign In"}</span>
                    <ArrowRight className="arrow-icon" />
                  </div>
                )}
              </button>
            </form>

            {/* <div className="form-footer">
              <p className="switch-text">{isSignup ? "Already have an account?" : "New to InvoicePro?"}</p>
              <button type="button" onClick={switchMode} className="switch-button">
                <span>{isSignup ? "Sign in instead" : "Create your account"}</span>
                <Sparkles className="sparkle-icon" />
              </button>
            </div> */}
            {/* {!isSignup && (
              <div className="forgot-password">
                <Link to="/forgot" className="forgot-link">Forgot your password?</Link>
              </div>
            )} */}
          </div>
        </div>

        <div className="copyright">
          <p>© 2025 InvoicePro. Crafted for JuggleSports.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
