// File: src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const roleId = Number(localStorage.getItem('role_id'));

  // 1. Chưa đăng nhập -> Đá về Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check quyền (Role)
  if (allowedRoles && !allowedRoles.includes(roleId)) {
    // Nếu Admin đi nhầm vào trang User -> Về Admin
    if (roleId === 1) return <Navigate to="/admin/dashboard" replace />;
    // Nếu User đi nhầm vào trang Admin -> Về User
    if (roleId === 2) return <Navigate to="/user/home" replace />;
    
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;