import { useState } from "react";
import { createNews } from "../api/api";

export default function CreateNews() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const user = Number(localStorage.getItem("user"));

  const submit = async () => {
    if (!title) return alert("Title required");
    if (body.length < 20) return alert("Body must be 20+ chars");

    await createNews({
      title,
      body,
      author_id: user,
      comments: []
    });

    window.location.href = "/";
  };

  return (
    <div>
      <h2>Create News</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={body} onChange={e => setBody(e.target.value)}></textarea>

      <button onClick={submit}>Submit</button>
    </div>
  );
}
