import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNewsById, updateNews } from "../api/api";
import "./EditNews.css";

export default function EditNews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = localStorage.getItem("user");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchNews = async () => {
      try {
        const res = await getNewsById(id);
        
        if (res.data.author_id !== userId) {
          setError("You can only edit your own news");
          setLoading(false);
          return;
        }
        
        setNews(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load news");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    fetchNews();
  }, [id, userId, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!news.title.trim()) {
      setError("News title cannot be empty");
      return;
    }

    const content = news.content || news.body || "";
    if (content.length < 20) {
      setError("News body must be at least 20 characters");
      return;
    }

    try {
      setSaving(true);
      await updateNews(id, {
        title: news.title.trim(),
        content: news.content.trim()
      });
      navigate("/");
    } catch (err) {
      setError("Failed to save changes");
      setSaving(false);
      console.error("Error:", err);
    }
  };

  if (loading) {
    return <div className="edit-news-container"><p>Loading...</p></div>;
  }

  if (error && !news) {
    return (
      <div className="edit-news-container">
        <div className="error-box">
          <p>{error}</p>
          <button onClick={() => navigate("/")}>Back to News List</button>
        </div>
      </div>
    );
  }

  if (!news) {
    return <div className="edit-news-container"><p>News not found</p></div>;
  }

  return (
    <div className="edit-news-container">
      <div className="edit-news-box">
        <div className="edit-news-header">
          <h1>Edit Article</h1>
          <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="title">Article Title *</label>
            <input 
              id="title"
              type="text" 
              value={news.title} 
              onChange={e => {
                setNews({ ...news, title: e.target.value });
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
              value={news.content || news.body || ""} 
              onChange={e => {
                setNews({ ...news, content: e.target.value });
                setError("");
              }}
              placeholder="Enter news content..."
              rows="10"
              className="form-textarea"
            />
            <div className="char-count">{(news.content || news.body || "").length} characters</div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
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
