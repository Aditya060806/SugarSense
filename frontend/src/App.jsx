import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { SimulationProvider } from './context/SimulationContext';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProcessControlPage from './pages/ProcessControlPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SimulationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161b22',
              color: '#c9d1d9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
            },
          }}
        />
        <AnimatePresence mode="wait">
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/process-control" element={<ProcessControlPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </SimulationProvider>
    </BrowserRouter>
  );
}

export default App;
