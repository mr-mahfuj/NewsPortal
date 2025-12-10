import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import NewsList from "./pages/NewsList";
import CreateNews from "./pages/CreateNews";
import NewsDetails from "./pages/NewsDetails";
import EditNews from "./pages/EditNews";
import "./App.css";

export default function App() {
    return (
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<NewsList />} />
            <Route path="/create" element={<CreateNews />} />
            <Route path="/news/:id" element={<NewsDetails />} />
            <Route path="/edit/:id" element={<EditNews />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
    );
}
