import { useEffect, useState } from "react";
import { getUsers } from "../api/api";

export default function Login() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    getUsers().then(res => setUsers(res.data));
  }, []);

  const handleLogin = () => {
    if (!selectedUser) return alert("Select a user!");

    localStorage.setItem("user", selectedUser);
    window.location.href = "/"; // redirect to news list
  };

  return (
    <div>
      <h2>Login</h2>
      <select onChange={e => setSelectedUser(e.target.value)}>
        <option>Select User</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
