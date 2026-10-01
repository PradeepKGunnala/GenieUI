import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { isTauri } from '@tauri-apps/api/core';
import '@xyflow/react/dist/style.css';
import './styles.css';
import App from './App';

const client = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchInterval: 10000, refetchOnWindowFocus: true } } });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><QueryClientProvider client={client}>{isTauri() ? <HashRouter><App /></HashRouter> : <BrowserRouter><App /></BrowserRouter>}</QueryClientProvider></React.StrictMode>,
);
