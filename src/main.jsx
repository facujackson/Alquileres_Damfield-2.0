import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (!window.storage) {
  window.storage = {
    get: async () => null,
    set: async () => {},
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
