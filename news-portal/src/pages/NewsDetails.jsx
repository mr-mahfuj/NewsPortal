import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNewsById, getNews } from "../api/api";
import Comments from "../components/Comments";
import "./NewsDetails.css";

export default function NewsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [users, setUsers] = useState([]);
  
  const userId = localStorage.getItem("user");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getNewsById(id);
        const newsData = res.data;
        setNews(newsData);

        if (newsData.author) {
          setAuthorName(newsData.author.full_name || newsData.author.username);
        } else {
          setAuthorName("Unknown");
        }

        const usersRes = await getNews(); 
        if (usersRes.data && Array.isArray(usersRes.data)) {          
          setUsers([]);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load news");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    fetchNews();
  }, [id, navigate]);

  const handleCommentAdded = async () => {
    
    try {
      const res = await getNewsById(id);
      setNews(res.data);
    } catch (err) {
      console.error("Error refreshing comments:", err);
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
          <span className="news-category">📑 {news.category || "General"}</span>
        </div>

        <div className="news-body">
          {news.content || news.body}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="news-info-section">
        <h3>Article Information</h3>
        <p><strong>Category:</strong> {news.category || "General"}</p>
        <p><strong>Published:</strong> {news.created_at ? new Date(news.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
        <p><strong>Last Updated:</strong> {news.updated_at ? new Date(news.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
      </div>

      {/* Comments Section */}
      <Comments 
        newsId={id}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}