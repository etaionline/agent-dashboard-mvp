import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DontPanicErrorBoundary from './components/DontPanicErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DontPanicErrorBoundary>
      <App />
    </DontPanicErrorBoundary>
  </React.StrictMode>
);
