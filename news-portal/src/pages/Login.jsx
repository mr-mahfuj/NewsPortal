import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../api/api";
import "./Login.css";

export default function Login() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfLoggedIn = () => {
      const loggedInUser = localStorage.getItem("user");
      if (loggedInUser) {
        navigate("/");
      }
    };

    checkIfLoggedIn();
    
    getUsers()
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load users");
        setLoading(false);
        console.error("Error:", err);
      });
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    const user = users.find(u => u.id == selectedUser);
    if (user) {
      localStorage.setItem("user", selectedUser);
      localStorage.setItem("userName", user.name);
      navigate("/");
    } else {
      setError("User not found");
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>📰 News Portal</h1>
        <p className="login-subtitle">Select your account to continue</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="user-select">Your Name:</label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setError("");
              }}
              className="user-select"
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
