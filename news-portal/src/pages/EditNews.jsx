import { useEffect, useState } from "react";
import { getNewsById, updateNews } from "../api/api";
import { useParams } from "react-router-dom";

export default function EditNews() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const user = Number(localStorage.getItem("user"));

  useEffect(() => {
    getNewsById(id).then(res => setNews(res.data));
  }, [id]);

  const save = async () => {
    if (news.author_id !== user) return alert("Not your post!");

    await updateNews(id, {
      title: news.title,
      body: news.body
    });

    window.location.href = "/";
  };

  if (!news) return <p>Loading...</p>;

  return (
    <div>
      <h2>Edit News</h2>
      <input value={news.title} onChange={e => setNews({ ...news, title: e.target.value })} />
      <textarea value={news.body} onChange={e => setNews({ ...news, body: e.target.value })}></textarea>

      <button onClick={save}>Save</button>
    </div>
  );
}
