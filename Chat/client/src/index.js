import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import LoginPage from './LoginPage';
import reportWebVitals from './reportWebVitals';
import './App.css';

const root = document.getElementById('root');

createRoot(root).render(
    <Router>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<App />} />
        </Routes>
    </Router>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
