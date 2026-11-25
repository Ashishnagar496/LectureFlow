import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TimetableProvider } from './context/TimetableContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/layout/Layout';

import { Dashboard } from './pages/Dashboard';
import { WeeklyTimetable } from './pages/WeeklyTimetable';
import { NotificationSettings } from './pages/NotificationSettings';
import { SelectSection } from './pages/SelectSection';
import { Profile } from './pages/Profile';
import { TimetableUpload } from './pages/TimetableUpload';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimetableProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />

              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/timetable" element={<WeeklyTimetable />} />
                <Route path="/select-section" element={<SelectSection />} />
                <Route path="/notifications" element={<NotificationSettings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/upload" element={<TimetableUpload />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </TimetableProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
