import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Modular CSS Architecture
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

