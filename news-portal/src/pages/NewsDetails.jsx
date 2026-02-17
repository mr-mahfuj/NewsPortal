import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNewsById, getUser, updateNews } from "../api/api";
import "./NewsDetails.css";

export default function NewsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [comment, setComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [userNames, setUserNames] = useState({});
  
  const userId = Number(localStorage.getItem("user"));

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getNewsById(id);
        setNews(res.data);

        try {
          const authorRes = await getUser(res.data.author_id);
          setAuthorName(authorRes.data.name);
        } catch (err) {
          setAuthorName("Unknown");
        }

        const names = {};
        for (const comment of res.data.comments || []) {
          if (!comment.user_id) {
            continue;
          }
          if (!names[comment.user_id]) {
            try {
              const userRes = await getUser(comment.user_id);
              names[comment.user_id] = userRes.data.name;
            } catch (err) {
              names[comment.user_id] = "Unknown";
            }
          }
        }
        setUserNames(names);
        setLoading(false);
      } catch (err) {
        setError("Failed to load news");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    fetchNews();
  }, [id, navigate]);

  const addComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError("Comment text cannot be empty");
      return;
    }

    if (!userId && !guestName.trim()) {
      setError("Please enter your name to comment");
      return;
    }

    try {
      setSubmitting(true);
      const updated = {
        ...news,
        comments: [
          ...(news.comments || []),
          {
            id: Date.now(),
            text: comment.trim(),
            user_id: userId || null,
            user_name: userId ? undefined : guestName.trim(),
            timestamp: new Date().toISOString()
          }
        ]
      };

      await updateNews(id, updated);
      setNews(updated);
      setComment("");
      setError("");
      setSubmitting(false);
      
      // Update user names map
      const userNamesTemp = { ...userNames };
      if (userId && !userNamesTemp[userId]) {
        const userRes = await getUser(userId);
        userNamesTemp[userId] = userRes.data.name;
        setUserNames(userNamesTemp);
      }
    } catch (err) {
      setError("Failed to add comment");
      setSubmitting(false);
      console.error("Error:", err);
    }
  };

  if (loading) {
    return <div className="news-details-container"><p>Loading...</p></div>;
  }

  if (!news) {
    return <div className="news-details-container"><p>News not found</p></div>;
  }

  return (
    <div className="news-details-container">
      <button className="back-btn" onClick={() => navigate("/")}>← Back to News List</button>

      <div className="news-details-box">
        <h1 className="news-title">{news.title}</h1>
        
        <div className="news-meta">
          <span className="author">By <strong>{authorName}</strong></span>
          {news.comments && <span className="comment-count">💬 {news.comments.length} Comments</span>}
        </div>

        <div className="news-body">
          {news.body}
        </div>
      </div>

      <div className="comments-section">
        <h2>Comments ({news.comments?.length || 0})</h2>

        <div className="comments-list">
          {news.comments && news.comments.length > 0 ? (
            news.comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <strong className="commenter-name">{c.user_name || userNames[c.user_id] || "Anonymous"}</strong>
                  <span className="comment-time">
                    {new Date(c.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            ))
          ) : (
            <p className="no-comments">No comments yet. Be the first to comment!</p>
          )}
        </div>

        <form onSubmit={addComment} className="add-comment-form">
          <h3>Add Your Comment</h3>
          {!userId && (
            <div className="form-group">
              <input
                type="text"
                value={guestName}
                onChange={e => {
                  setGuestName(e.target.value);
                  setError("");
                }}
                placeholder="Your name"
                className="comment-textarea"
              />
            </div>
          )}
          <div className="form-group">
            <textarea
              value={comment}
              onChange={e => {
                setComment(e.target.value);
                setError("");
              }}
              placeholder="Write your comment here..."
              rows="4"
              className="comment-textarea"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-comment-btn" disabled={submitting}>
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>
    </div>
  );
}
    