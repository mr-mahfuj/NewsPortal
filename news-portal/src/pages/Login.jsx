import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/api";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfLoggedIn = () => {
      const token = localStorage.getItem("token");
      const storedUserName = localStorage.getItem("userName");
      if (token && storedUserName) {
        navigate("/");
        return;
      }
      if (token && !storedUserName) {
        localStorage.removeItem("token");
      }
    };

    checkIfLoggedIn();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await login({ username, password });
      const { access_token, user } = response.data;
      
      // Store token and user info
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", user.id);
      localStorage.setItem("userName", user.username);
      
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>📰 News Portal</h1>
        <p className="login-subtitle">Login to continue</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="form-input"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="form-input"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
