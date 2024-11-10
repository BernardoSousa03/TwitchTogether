import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ReactTogether } from 'react-together';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ReactTogether
    sessionParams={{
      appId: import.meta.env['VITE_APP_ID'],
      apiKey: import.meta.env['VITE_API_KEY'],
      name: import.meta.env['VITE_SESSION_NAME'],
      password: import.meta.env['VITE_SESSION_PASSWORD'],
    }}>
      <App />
    </ReactTogether>
  </React.StrictMode>
);
