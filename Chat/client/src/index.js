import React from "react";
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import reportWebVitals from "./reportWebVitals";
import "./App.css";
import HomePage from "./HomePage";
import RegisterPage from "./RegisterPage";
import App from "./App";

const root = document.getElementById("root");

createRoot(root).render(
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/chat/*" element={<App />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  </Router>
);

reportWebVitals();
