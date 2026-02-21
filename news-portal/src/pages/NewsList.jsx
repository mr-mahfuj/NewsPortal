import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNews, deleteNews, getUser } from "../api/api";
import NewsArticle from "../components/NewsArticle";
import "./NewsList.css";

export default function NewsList() {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userMap, setUserMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState(() => localStorage.getItem("user"));
  const [userName, setUserName] = useState(() => localStorage.getItem("userName"));
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const itemsPerPage = 6;
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getNews();
        const newsData = res.data || [];
        setNews(newsData);
        setFilteredNews(newsData);
        
        // Build user map from author data in news response
        const users = {};
        newsData.forEach(item => {
          if (item.author && item.author.username) {
            users[item.author_id] = item.author.full_name || item.author.username;
          } else {
            users[item.author_id] = "Unknown";
          }
        });
        setUserMap(users);
        setLoading(false);
      } catch (err) {
        setError("Failed to load news");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    fetchNews();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setCurrentPage(1);
    
    if (term.trim() === "") {
      setFilteredNews(news);
    } else {
      setFilteredNews(news.filter(n => n.title.toLowerCase().includes(term)));
    }
  };

  const handleDelete = async (id, authorId) => {
    if (authorId !== userId) {
      setError("You can only delete your own news!");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this news?")) {
      return;
    }

    try {
      await deleteNews(id);
      setNews(news.filter(n => n.id !== id));
      setFilteredNews(filteredNews.filter(n => n.id !== id));
      setError("");
    } catch (err) {
      setError("Failed to delete news");
      console.error("Error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    setUserId(null);
    setUserName(null);
    setToken(null);
    navigate("/login");
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

  if (loading) {
    return <div className="news-list-container"><p>Loading news...</p></div>;
  }

  return (
    <div className="news-list-container">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📰 News Portal</h1>
        </div>
        <div className="navbar-right">
          {token ? (
            <>
              <span className="logged-in-text">Logged in as: <strong>{userName || "User"}</strong></span>
              <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button type="button" className="logout-btn" onClick={() => navigate("/login")}>Login</button>
          )}
        </div>
      </div>

      <div className="news-header">
        <div className="header-top">
          <h2>All News</h2>
          {token ? (
            <button type="button" className="btn btn-primary" onClick={() => navigate("/create")}>+ Create News</button>
          ) : (
            <span className="login-hint">Login to create news</span>
          )}
        </div>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search news by title..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredNews.length === 0 ? (
        <div className="no-news">
          <p>{searchTerm ? "No news found matching your search." : "No news available yet."}</p>
        </div>
      ) : (
        <>
          <div className="articles-grid">
            {paginatedNews.map(n => (
              <div key={n.id} className="article-wrapper">
                <NewsArticle 
                  title={n.title} 
                  body={n.content || n.body} 
                  authorName={userMap[n.author_id] || "Unknown"}
                  commentCount={0}
                />

                <div className="article-actions">
                  <button className="btn btn-small btn-view" onClick={() => navigate(`/news/${n.id}`)}>View Details</button>

                  {userId && n.author_id === userId && (
                    <>
                      <button className="btn btn-small btn-secondary" onClick={() => navigate(`/edit/${n.id}`)}>Edit</button>
                      <button 
                        className="btn btn-small btn-danger" 
                        onClick={() => handleDelete(n.id, n.author_id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">Page {currentPage} of {totalPages}</span>
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
