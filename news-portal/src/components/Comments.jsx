import { useState, useEffect } from "react";
import { addComment, deleteComment, getComments } from "../api/api";
import "./Comments.css";

export default function Comments({ newsId, onCommentAdded, users }) {
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  
  const currentUserId = localStorage.getItem("user");
  const currentToken = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Anonymous";

  // Fetch comments when component mounts or newsId changes
  useEffect(() => {
    fetchComments();
  }, [newsId]);

  const fetchComments = async () => {
    setFetchLoading(true);
    try {
      const res = await getComments(newsId);
      setComments(res.data.comments || []);
      setError("");
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      setError("You must be logged in to comment");
      return;
    }

    if (!commentText.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const commentData = {
        text: commentText.trim()
      };

      await addComment(newsId, commentData);
      setCommentText("");
      
      // Refresh comments list
      await fetchComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error("Comment error:", err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to add comment. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteComment(commentId);
      
      // Refresh comments list
      await fetchComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  const getUserName = (username, fullName) => {
    return fullName || username || "Anonymous";
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">Comments ({comments.length})</h3>
      
      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleAddComment} className="comment-form">
          <div className="form-group">
            <textarea
              placeholder="Write your comment here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="3"
              className="comment-textarea"
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="comment-submit-btn"
            disabled={loading}
          >
            {loading ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <div className="login-message">
          Log in to post comments
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {fetchLoading ? (
          <p className="loading">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">
                  {getUserName(comment.username, comment.full_name)}
                </span>
                <span className="comment-time">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              
              <p className="comment-text">{comment.text}</p>
              
              {currentUserId && comment.user_id === currentUserId && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="delete-comment-btn"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
