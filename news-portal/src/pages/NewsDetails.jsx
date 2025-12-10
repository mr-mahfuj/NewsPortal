import { useEffect, useState } from "react";
import { getNewsById, updateNews } from "../api/api";
import { useParams } from "react-router-dom";

export default function NewsDetails() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [comment, setComment] = useState("");
  const user = Number(localStorage.getItem("user"));

  useEffect(() => {
    getNewsById(id).then(res => setNews(res.data));
  }, [id]);

  const addComment = async () => {
    if (!comment) return alert("Write a comment!");

    const updated = {
      ...news,
      comments: [
        ...news.comments,
        {
          id: Date.now(),
          text: comment,
          user_id: user,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await updateNews(id, updated);

    setNews(updated);
    setComment("");
  };

  if (!news) return <p>Loading...</p>;

  return (
    <div>
      <h2>{news.title}</h2>
      <p>{news.body}</p>

      <h3>Comments</h3>
      {news.comments.map(c => (
        <p key={c.id}>{c.text}</p>
      ))}

      <textarea value={comment} onChange={e => setComment(e.target.value)}></textarea>
      <button onClick={addComment}>Add Comment</button>
    </div>
  );
}
    