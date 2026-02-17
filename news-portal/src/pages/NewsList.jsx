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
  const itemsPerPage = 6;
  
  const userId = Number(localStorage.getItem("user"));
  const userName = localStorage.getItem("userName");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getNews();
        setNews(res.data);
        setFilteredNews(res.data);
        
        // Fetch all users to create a map
        const users = {};
        for (const item of res.data) {
          if (!users[item.author_id]) {
            try {
              const userRes = await getUser(item.author_id);
              users[item.author_id] = userRes.data.name;
            } catch (err) {
              users[item.author_id] = "Unknown";
            }
          }
        }
        setUserMap(users);
        setLoading(false);
      } catch (err) {
        setError("Failed to load news");
        setLoading(false);
        console.error("Error:", err);
      }
    };

    fetchNews();
  }, [navigate]);

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
          {userName ? (
            <>
              <span className="logged-in-text">Logged in as: <strong>{userName}</strong></span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="logout-btn" onClick={() => navigate("/login")}>Login</button>
          )}
        </div>
      </div>

      <div className="news-header">
        <div className="header-top">
          <h2>All News</h2>
          {userId ? (
            <a className="btn btn-primary" href="/create">+ Create News</a>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate("/login")}>Login to Create</button>
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
                  body={n.body} 
                  authorName={userMap[n.author_id] || "Unknown"}
                  commentCount={n.comments?.length || 0}
                />

                <div className="article-actions">
                  <a className="btn btn-small btn-view" href={`/news/${n.id}`}>View Details</a>

                  {userId && n.author_id === userId && (
                    <>
                      <a className="btn btn-small btn-secondary" href={`/edit/${n.id}`}>Edit</a>
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
