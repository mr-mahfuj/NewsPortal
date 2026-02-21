import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createNews } from "../api/api";
import "./CreateNews.css";

export default function CreateNews() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("user");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("News title cannot be empty");
      return;
    }
    
    if (body.length < 20) {
      setError("News body must be at least 20 characters");
      return;
    }

    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      await createNews({
        title: title.trim(),
        content: body.trim(),
        category: "General"
      });
      navigate("/");
    } catch (err) {
      setError("Failed to create news. Please try again.");
      console.error("Error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="create-news-container">
      <div className="create-news-box">
        <div className="create-news-header">
          <h1>Create New Article</h1>
          <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Article Title *</label>
            <input 
              id="title"
              type="text" 
              value={title} 
              onChange={e => {
                setTitle(e.target.value);
                setError("");
              }}
              placeholder="Enter news title..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Article Content *</label>
            <textarea 
              id="body"
              value={body} 
              onChange={e => {
                setBody(e.target.value);
                setError("");
              }}
              placeholder="Enter news content (minimum 20 characters)..."
              rows="10"
              className="form-textarea"
            />
            <div className="char-count">{body.length} characters</div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Publishing..." : "Publish Article"}
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
