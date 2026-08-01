import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

// Redirige las peticiones a http://localhost:8080 hacia el backend real
// SOLO cuando exista la variable de entorno REACT_APP_API_URL (Vercel).
// En tu compu, esa variable no existe, asi que nada cambia en local.
const backendUrl = process.env.REACT_APP_API_URL;

// Cubre las peticiones hechas con axios
axios.interceptors.request.use((config) => {
  if (backendUrl && config.url && config.url.startsWith('http://localhost:8080')) {
    config.url = config.url.replace('http://localhost:8080', backendUrl);
  }
  return config;
});

// Cubre las peticiones hechas con fetch() nativo
if (backendUrl) {
  const originalFetch = window.fetch;
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('http://localhost:8080')) {
      input = input.replace('http://localhost:8080', backendUrl);
    } else if (input instanceof Request && input.url.startsWith('http://localhost:8080')) {
      input = new Request(input.url.replace('http://localhost:8080', backendUrl), input);
    }
    return originalFetch(input, init);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    
    <App />
  
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();