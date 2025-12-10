import { useEffect, useState } from "react";
import { getNews, deleteNews } from "../api/api";

export default function NewsList() {
  const [news, setNews] = useState([]);
  const user = Number(localStorage.getItem("user"));

  useEffect(() => {
    getNews().then(res => setNews(res.data));
  }, []);

  const handleDelete = async (id, authorId) => {
    if (authorId !== user) return alert("You cannot delete this!");
    await deleteNews(id);
    setNews(news.filter(n => n.id !== id));
  };

  return (
    <div>
      <h2>News</h2>
      <a href="/create">Create News</a>

      {news.map(n => (
        <div key={n.id}>
          <h3>{n.title}</h3>
          <p>Author: {n.author_id}</p>

          <a href={`/news/${n.id}`}>View</a>

          {n.author_id === user && (
            <>
              <a href={`/edit/${n.id}`}>Edit</a>
              <button onClick={() => handleDelete(n.id, n.author_id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
