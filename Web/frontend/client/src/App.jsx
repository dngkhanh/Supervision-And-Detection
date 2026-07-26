// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/loginPage';
import AdminDashboard from './pages/adminPages/AdminDashboard';
import AdminMembers from './pages/adminPages/AdminMembers';
import UserDashboard from './pages/userPages/UserDashboard'; 
import HomePage from './pages/HomePage';
import CreateJob from './pages/CreateJob';
import JobDetail from './pages/JobDetail';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyJobs from './pages/MyJobs';
import AdminJobs from './pages/AdminJobs';
import EditJob from './pages/EditJob';

// Component bảo vệ
import PrivateRoute from './components/PrivateRoutes';

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<HomePage />} />
      <Route path="/candidates" element={<CreateJob />} />
      <Route path="/job/:id" element={<JobDetail />} />
      <Route path="/edit-job/:id" element={
        <PrivateRoute allowedRoles={[1, 2]}>
          <EditJob />
        </PrivateRoute>
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/my-jobs" element={<MyJobs />} />
      <Route path="/admin/jobs" element={<AdminJobs />} />

      {/* ADMIN ROUTES (Role = 1) */}
      <Route 
        path="/admin/dashboard" 
        element={
          <PrivateRoute allowedRoles={[1]}>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/members" 
        element={
          <PrivateRoute allowedRoles={[1]}>
            <AdminMembers />
          </PrivateRoute>
        } 
      />

      {/* USER ROUTE (Role = 2) */}
      <Route 
        path="/user/dashboard"
        element={
          <PrivateRoute allowedRoles={[2]}>
            <UserDashboard />
          </PrivateRoute>
        } 
      />
      
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default App;