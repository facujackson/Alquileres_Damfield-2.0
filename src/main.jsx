import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installFirebaseStorage } from './firebaseStorage';

installFirebaseStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

