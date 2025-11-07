import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // 1. Impor file CSS global (yang berisi Tailwind)

// 2. Temukan <div id="root"> di index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// 3. Render aplikasi Anda di dalam root
root.render(
  <React.StrictMode>
    {/* 4. Bungkus App dengan BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
